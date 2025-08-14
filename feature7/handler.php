<?php
require_once '../common/db.php';

class Feature7AnalyticsHandler {
    private $conn;
    public function __construct() {
        global $conn;
        $this->conn = $conn;
    }

    /* =========================
       Dimensions (filters)
       ========================= */
    public function getDimensions() {
        $dims = [
            'destinations' => [],
            'drivers'      => [],
            'transports'   => [],
            'routes'       => []
        ];

        // Destinations from Shipments
        $sql = "SELECT DISTINCT shipment_destination AS destination
                FROM Shipments
                WHERE shipment_destination IS NOT NULL AND shipment_destination <> ''
                ORDER BY destination";
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) $dims['destinations'][] = $r['destination'];
        }

        // Drivers
        $sql = "SELECT driver_id, CONCAT(first_name,' ',last_name) AS driver_name
                FROM Drivers ORDER BY first_name, last_name";
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) $dims['drivers'][] = $r;
        }

        // Transports (with driver name)
        $sql = "SELECT t.transport_id, t.vehicle_type, CONCAT(d.first_name,' ',d.last_name) AS driver_name
                FROM Transports t
                LEFT JOIN Drivers d ON t.driver_id = d.driver_id
                ORDER BY t.vehicle_type";
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) $dims['transports'][] = $r;
        }

        // Routes
        $sql = "SELECT route_id, route_name, destination, duration, distance, road_condition
                FROM Routes ORDER BY destination, route_name";
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) $dims['routes'][] = $r;
        }

        return $dims;
    }

    /* =========================
       Public API payloads
       ========================= */
    public function getAnalytics($filters) {
        return [
            'on_time_weekly'       => $this->onTimeWeekly($filters),
            'volume_status_daily'  => $this->volumeStatusDaily($filters),
            'cost_per_destination' => $this->costPerDestination($filters),
            'driver_reliability'   => $this->driverReliability($filters),
            'spoilage_summary'     => $this->spoilageSummary($filters)
        ];
    }

    public function getKPIs($filters) {
        $range = $this->deriveRange($filters['from'] ?? null, $filters['to'] ?? null);
        $cur  = $filters; $cur['from']  = $range['from'];     $cur['to']  = $range['to'];
        $prev = $filters; $prev['from'] = $range['prev_from']; $prev['to'] = $range['prev_to'];

        $c = $this->kpiCore($cur);
        $p = $this->kpiCore($prev);

        $ratio = function($a,$b){
            if ($b === null || $b == 0) return null;
            return ($a - $b) / $b;
        };

        $c['total_shipments_delta']         = $ratio($c['total_shipments'], $p['total_shipments']);
        $c['dispatched_delta']              = $ratio($c['dispatched'], $p['dispatched']);
        $c['delivered_delta']               = $ratio($c['delivered'], $p['delivered']);
        $c['avg_transit_hours_delta']       = ($p['avg_transit_hours'] ?? 0) > 0 ? ($c['avg_transit_hours'] - $p['avg_transit_hours']) / $p['avg_transit_hours'] : null;
        $c['total_cost_delta']              = $ratio($c['total_cost'], $p['total_cost']);
        $c['avg_cost_per_shipment_delta']   = ($p['avg_cost_per_shipment'] ?? 0) > 0 ? ($c['avg_cost_per_shipment'] - $p['avg_cost_per_shipment']) / $p['avg_cost_per_shipment'] : null;
        $c['cost_per_km_delta']             = ($p['cost_per_km'] ?? 0) > 0 ? ($c['cost_per_km'] - $p['cost_per_km']) / $p['cost_per_km'] : null;
        $c['dispatch_compliance_delta']     = ($p['dispatch_compliance'] ?? 0) > 0 ? ($c['dispatch_compliance'] - $p['dispatch_compliance']) / $p['dispatch_compliance'] : null;

        return $c;
    }

    /* =========================
       KPI Core
       ========================= */
    private function kpiCore($filters) {
        // Shipments stats
        $whereS = $this->whereShipments($filters);
        $sql = "SELECT COUNT(*) AS c,
                       SUM(COALESCE(transportation_cost,0)) AS total_cost,
                       AVG(NULLIF(transportation_cost,0)) AS avg_cost
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                ".($whereS ? " WHERE $whereS" : "");
        $r = $this->fetchOne($sql);
        $total_shipments = (int)($r['c'] ?? 0);
        $total_cost = (float)($r['total_cost'] ?? 0);
        $avg_cost = $total_shipments > 0 ? (float)$r['avg_cost'] : 0;

        // Dispatched (has progress)
        $whereP = $this->whereProgress($filters);
        $sql = "SELECT COUNT(DISTINCT shipment_id) AS n
                FROM Shipment_Progress sp".($whereP ? " WHERE $whereP" : "");
        $dispatched = (int)($this->fetchOne($sql)['n'] ?? 0);

        // Delivered count
        $sql = "SELECT COUNT(*) AS n
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                ".($whereS ? " WHERE $whereS AND s.status='Delivered'" : " WHERE s.status='Delivered'");
        $delivered = (int)($this->fetchOne($sql)['n'] ?? 0);

        // Avg planned transit time (hrs)
        $sql = "SELECT AVG(TIMESTAMPDIFF(MINUTE, dispatch_time, estimated_arrival_time)) AS minutes
                FROM Shipment_Progress sp
                ".($whereP ? " WHERE $whereP" : "");
        $avg_minutes = (float)($this->fetchOne($sql)['minutes'] ?? 0);
        $avg_transit_hours = $avg_minutes > 0 ? round($avg_minutes / 60.0, 2) : 0;

        // Cost per km (latest route per shipment)
        $cpk = $this->costPerKm($filters);

        // Dispatch compliance
        $dispatch_compliance = $total_shipments > 0 ? ($dispatched / $total_shipments) : null;

        return [
            'total_shipments'        => $total_shipments,
            'dispatched'             => $dispatched,
            'delivered'              => $delivered,
            'avg_transit_hours'      => $avg_transit_hours,
            'total_cost'             => round($total_cost, 2),
            'avg_cost_per_shipment'  => $avg_cost !== null ? round($avg_cost, 2) : 0,
            'cost_per_km'            => $cpk,
            'dispatch_compliance'    => $dispatch_compliance
        ];
    }

    private function costPerKm($filters){
        $where = [];
        if (!empty($filters['destination']))  $where[] = "s.shipment_destination = '".$this->conn->real_escape_string($filters['destination'])."'";
        $where = array_merge($where, $this->whereDate('s.shipment_date', $filters));
        if (!empty($filters['driver_id']))    $where[] = "t.driver_id = ".intval($filters['driver_id']);
        if (!empty($filters['transport_id'])) $where[] = "s.transport_id = ".intval($filters['transport_id']);
        if (!empty($filters['status']))       $where[] = "s.status = '".$this->conn->real_escape_string($filters['status'])."'";

        $sql = "SELECT SUM(COALESCE(s.transportation_cost,0)) AS total_cost,
                       SUM(COALESCE(rd.distance,0)) AS total_km
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN (
                    SELECT sp.shipment_id, r.distance
                    FROM Shipment_Progress sp
                    JOIN Routes r ON sp.route_id = r.route_id
                    JOIN (
                        SELECT shipment_id, MAX(dispatch_time) AS last_dispatch
                        FROM Shipment_Progress
                        GROUP BY shipment_id
                    ) last
                      ON last.shipment_id = sp.shipment_id
                     AND last.last_dispatch = sp.dispatch_time
                ) rd ON rd.shipment_id = s.shipment_id
                ".(count($where) ? " WHERE ".implode(' AND ', $where) : "");
        $r = $this->fetchOne($sql);
        $total_cost = (float)($r['total_cost'] ?? 0);
        $km = (float)($r['total_km'] ?? 0);
        return $km > 0 ? round($total_cost/$km, 2) : null;
    }

    /* =========================
       Charts data builders
       ========================= */

    // 1) On-Time Delivery Rate (weekly)
    private function onTimeWeekly($filters) {
        $where = $this->whereDate('delivery_date', $filters);

        // Optional: filter by a specific driver (map driver_id -> name in Deliveries)
        if (!empty($filters['driver_id'])) {
            $did = intval($filters['driver_id']);
            $name = null;
            $res = $this->conn->query("SELECT CONCAT(first_name,' ',last_name) AS nm FROM Drivers WHERE driver_id=$did");
            if ($res && $res->num_rows>0) $name = $res->fetch_assoc()['nm'];
            if ($name) $where[] = "delivery_man_name = '".$this->conn->real_escape_string($name)."'";
        }

        $sql = "SELECT YEARWEEK(delivery_date, 3) AS wk,
                       MIN(delivery_date) AS week_start,
                       SUM(delivery_status='on time') AS ontime,
                       COUNT(*) AS total
                FROM Deliveries"
                .(count($where) ? " WHERE ".implode(' AND ',$where) : "")
                ." GROUP BY YEARWEEK(delivery_date, 3)
                  ORDER BY week_start ASC";

        $labels = []; $rate = []; $totals=[];
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) {
                $labels[] = $r['week_start'];
                $tot = (int)$r['total'];
                $ont = (int)$r['ontime'];
                $totals[] = $tot;
                $rate[] = $tot>0 ? round(100.0*$ont/$tot, 2) : 0;
            }
        }
        return ['labels'=>$labels, 'rates'=>$rate, 'totals'=>$totals];
    }

    // 2) Shipment Volume & Status Trend (daily)
    private function volumeStatusDaily($filters) {
        $where = $this->whereDate('s.shipment_date', $filters);

        if (!empty($filters['destination']))  $where[] = "s.shipment_destination = '".$this->conn->real_escape_string($filters['destination'])."'";
        if (!empty($filters['status']))       $where[] = "s.status = '".$this->conn->real_escape_string($filters['status'])."'";
        if (!empty($filters['driver_id']))    $where[] = "t.driver_id = ".intval($filters['driver_id']);
        if (!empty($filters['transport_id'])) $where[] = "s.transport_id = ".intval($filters['transport_id']);

        $sql = "SELECT s.shipment_date,
                       SUM(s.status='Planned')    AS planned,
                       SUM(s.status='In Transit') AS in_transit,
                       SUM(s.status='Delivered')  AS delivered,
                       SUM(s.status='Pending')    AS pending,
                       COUNT(*) AS total
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                ".(count($where) ? " WHERE ".implode(' AND ',$where) : "")."
                GROUP BY s.shipment_date
                ORDER BY s.shipment_date ASC";

        $labels=[]; $planned=[]; $in_transit=[]; $delivered=[]; $pending=[]; $total=[];
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) {
                $labels[]     = $r['shipment_date'];
                $planned[]    = (int)$r['planned'];
                $in_transit[] = (int)$r['in_transit'];
                $delivered[]  = (int)$r['delivered'];
                $pending[]    = (int)$r['pending'];
                $total[]      = (int)$r['total'];
            }
        }
        return [
            'labels'=>$labels,
            'planned'=>$planned, 'in_transit'=>$in_transit, 'delivered'=>$delivered, 'pending'=>$pending,
            'total'=>$total
        ];
    }

    // 3) Transport Cost per Destination & Cost-per-Km
    private function costPerDestination($filters) {
        $where = [];
        if (!empty($filters['destination']))  $where[] = "s.shipment_destination = '".$this->conn->real_escape_string($filters['destination'])."'";
        $dWhere = array_merge($where, $this->whereDate('s.shipment_date', $filters));
        if (!empty($filters['driver_id']))    $dWhere[] = "t.driver_id = ".intval($filters['driver_id']);
        if (!empty($filters['transport_id'])) $dWhere[] = "s.transport_id = ".intval($filters['transport_id']);
        if (!empty($filters['status']))       $dWhere[] = "s.status = '".$this->conn->real_escape_string($filters['status'])."'";

        $sql = "SELECT s.shipment_destination AS dest,
                       SUM(COALESCE(s.transportation_cost,0)) AS total_cost,
                       SUM(COALESCE(rd.distance,0)) AS total_km
                FROM Shipments s
                LEFT JOIN Transports t ON s.transport_id = t.transport_id
                LEFT JOIN (
                    SELECT sp.shipment_id, r.distance
                    FROM Shipment_Progress sp
                    JOIN Routes r ON sp.route_id = r.route_id
                    JOIN (
                        SELECT shipment_id, MAX(dispatch_time) AS last_dispatch
                        FROM Shipment_Progress
                        GROUP BY shipment_id
                    ) last
                      ON last.shipment_id = sp.shipment_id
                     AND last.last_dispatch = sp.dispatch_time
                ) rd ON rd.shipment_id = s.shipment_id
                ".(count($dWhere) ? " WHERE ".implode(' AND ', $dWhere) : "")."
                GROUP BY s.shipment_destination
                ORDER BY total_cost DESC";

        $labels=[]; $costs=[]; $cpkm=[];
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) {
                $labels[] = $r['dest'];
                $costs[]  = (float)$r['total_cost'];
                $km       = (float)$r['total_km'];
                $cpkm[]   = $km > 0 ? round($r['total_cost']/$km, 2) : 0;
            }
        }
        return ['labels'=>$labels, 'costs'=>$costs, 'cost_per_km'=>$cpkm];
    }

    // 4) Driver Reliability Leaderboard (Top 5)
    private function driverReliability($filters) {
        $where = $this->whereDate('delivery_date', $filters);
        $sql = "SELECT delivery_man_name AS driver,
                       AVG(delivery_success='successful')*100 AS success_rate,
                       AVG(delivery_status='on time')*100 AS on_time_rate,
                       COUNT(*) AS deliveries
                FROM Deliveries"
                .(count($where) ? " WHERE ".implode(' AND ',$where) : "")
                ." GROUP BY delivery_man_name
                  HAVING deliveries > 0
                  ORDER BY success_rate DESC, deliveries DESC
                  LIMIT 5";
        $items=[];
        if ($res = $this->conn->query($sql)) {
            while ($r = $res->fetch_assoc()) {
                $items[] = [
                    'driver'        => $r['driver'],
                    'success_rate'  => round((float)$r['success_rate'],2),
                    'on_time_rate'  => round((float)$r['on_time_rate'],2),
                    'deliveries'    => (int)$r['deliveries']
                ];
            }
        }
        return ['items'=>$items];
    }

    // 5) Spoilage summary (for pie chart)
    private function spoilageSummary($filters) {
        $where = $this->whereDate('delivery_date', $filters);
        $sql = "SELECT SUM(spoilage_quantity > 0) AS spoiled,
                       COUNT(*) AS total
                FROM Deliveries"
                .(count($where) ? " WHERE ".implode(' AND ',$where) : "");
        $r = $this->fetchOne($sql);
        $spoiled = (int)($r['spoiled'] ?? 0);
        $total   = (int)($r['total'] ?? 0);
        $ok      = max(0, $total - $spoiled);
        return ['spoiled'=>$spoiled, 'ok'=>$ok, 'total'=>$total];
    }

    /* =========================
       Helpers
       ========================= */
    private function fetchOne($sql){
        $res = $this->conn->query($sql);
        if ($res && $res->num_rows>0) return $res->fetch_assoc();
        return [];
    }

    private function normDate($d) {
        if (!$d) return null;
        $ts = strtotime($d);
        if (!$ts) return null;
        return date('Y-m-d', $ts);
    }

    private function whereDate($col, $filters) {
        $w = [];
        $from = $this->normDate($filters['from'] ?? null);
        $to   = $this->normDate($filters['to']   ?? null);
        if ($from) $w[] = "$col >= '".$this->conn->real_escape_string($from)."'";
        if ($to)   $w[] = "$col <= '".$this->conn->real_escape_string($to)."'";
        return $w;
    }

    private function whereShipments($filters){
        $w = $this->whereDate('s.shipment_date', $filters);
        if (!empty($filters['destination']))  $w[] = "s.shipment_destination = '".$this->conn->real_escape_string($filters['destination'])."'";
        if (!empty($filters['status']))       $w[] = "s.status = '".$this->conn->real_escape_string($filters['status'])."'";
        if (!empty($filters['driver_id']))    $w[] = "t.driver_id = ".intval($filters['driver_id']);
        if (!empty($filters['transport_id'])) $w[] = "s.transport_id = ".intval($filters['transport_id']);
        return implode(' AND ', $w);
    }

    private function whereProgress($filters){
        $w = $this->whereDate('sp.dispatch_time', $filters);
        if (!empty($filters['route_id'])) $w[] = "sp.route_id = ".intval($filters['route_id']);
        return implode(' AND ', $w);
    }

    private function deriveRange($from, $to){
        $toD   = $this->normDate($to)   ?? date('Y-m-d');
        $fromD = $this->normDate($from) ?? date('Y-m-d', strtotime("$toD -30 days"));

        $fromTS = strtotime($fromD);
        $toTS   = strtotime($toD);
        $days   = max(1, (int)floor(($toTS - $fromTS) / 86400) + 1);

        $prev_to   = date('Y-m-d', strtotime("$fromD -1 day"));
        $prev_from = date('Y-m-d', strtotime("$prev_to -".($days-1)." days"));

        return ['from'=>$fromD, 'to'=>$toD, 'prev_from'=>$prev_from, 'prev_to'=>$prev_to];
    }
}
?>
