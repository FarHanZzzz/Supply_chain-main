<?php
require_once '../common/db.php';

class Feature8Handler {
    private $conn;

    public function __construct(){
        global $conn;
        $this->conn = $conn;
    }

    private function scalar($sql){
        $res = $this->conn->query($sql);
        if(!$res){ return null; }
        $row = $res->fetch_row();
        return $row ? (is_numeric($row[0]) ? 0 + $row[0] : $row[0]) : null;
    }

    public function getKPIs(){
        // Revenue to date
        $revenue = $this->scalar("SELECT COALESCE(SUM(total_price),0) FROM Orderlines");

        // Shipments
        $total_shipments = $this->scalar("SELECT COUNT(*) FROM Shipments");
        $in_transit      = $this->scalar("SELECT COUNT(*) FROM Shipments WHERE status='In Transit'");

        // Avg transport cost / shipment
        $avg_transport_cost = $this->scalar("SELECT ROUND(AVG(transportation_cost),2) FROM Shipments");

        // Warehouse utilization % = (stored raw + packaged qty with warehouse) / sum(capacity)
        $sum_capacity = $this->scalar("SELECT COALESCE(SUM(capacity),0) FROM Warehouses");
        $raw_qty      = $this->scalar("SELECT COALESCE(SUM(quantity),0) FROM Harvest_Batches WHERE status='Stored'");
        $pkg_qty      = $this->scalar("SELECT COALESCE(SUM(production_quantity),0) FROM Packaged_Product_Batches WHERE warehouse_id IS NOT NULL");
        $util_pct     = null;
        if ($sum_capacity && $sum_capacity > 0){
            $util_pct = round(100.0 * (($raw_qty ?: 0) + ($pkg_qty ?: 0)) / $sum_capacity, 2);
        } else {
            $util_pct = null;
        }

        // Orders count
        $orders_count = $this->scalar("SELECT COUNT(*) FROM Orders");

        // Delivery KPIs
        $res = $this->conn->query("SELECT COUNT(*) AS total,
                                          SUM(delivery_status='on time') AS on_time,
                                          SUM(delivery_success='successful') AS success
                                   FROM Deliveries");
        $on_time_rate = null; $success_rate = null;
        if($res){
            $row = $res->fetch_assoc();
            $total = (int)$row['total'];
            if ($total > 0){
                $on_time_rate = round(100.0 * ((int)$row['on_time']) / $total, 2);
                $success_rate = round(100.0 * ((int)$row['success']) / $total, 2);
            } else {
                $on_time_rate = 0.0;
                $success_rate = 0.0;
            }
        }

        return [
            'revenue' => $revenue ?: 0.0,
            'total_shipments' => $total_shipments ?: 0,
            'in_transit' => $in_transit ?: 0,
            'avg_transport_cost' => $avg_transport_cost ?: 0.0,
            'warehouse_util_pct' => $util_pct,
            'orders_count' => $orders_count ?: 0,
            'on_time_rate_pct' => $on_time_rate,
            'delivery_success_rate_pct' => $success_rate
        ];
    }

    public function getHarvestByCropType(){
        $sql = "SELECT h.harvest_type AS label,
               SUM(h.harvest_quantity) AS qty
                FROM Harvests h
                GROUP BY h.harvest_type
                ORDER BY qty DESC";

        $res = $this->conn->query($sql);
        $labels=[]; $values=[];
        if($res){
            while($r = $res->fetch_assoc()){
                $labels[] = $r['label'];
                $values[] = (float)$r['qty'];
            }
        }
        return ['labels'=>$labels, 'values'=>$values];
    }

    public function getHarvestQtyByWarehouse(){
        // Stored harvest batches by warehouse
        $sql = "SELECT w.warehouse_name AS label, COALESCE(SUM(hb.quantity),0) AS qty
                FROM Warehouses w
                LEFT JOIN Harvest_Batches hb ON hb.warehouse_id = w.warehouse_id AND hb.status='Stored'
                GROUP BY w.warehouse_id, w.warehouse_name
                ORDER BY qty DESC";
        $res = $this->conn->query($sql);
        $labels=[]; $values=[];
        if($res){
            while($r = $res->fetch_assoc()){
                $labels[] = $r['label'];
                $values[] = (float)$r['qty'];
            }
        }
        return ['labels'=>$labels, 'values'=>$values];
    }

    public function getTransportCostByDestination(){
        $sql = "SELECT shipment_destination AS label,
                    SUM(transportation_cost) AS cost
                FROM Shipments
                GROUP BY shipment_destination
                ORDER BY cost DESC";

        $res = $this->conn->query($sql);
        $labels=[]; $values=[];
        if($res){
            while($r = $res->fetch_assoc()){
                // Only use the first part of "City, Country"
                $labels[] = explode(',', $r['label'])[0];
                $values[] = (float)$r['cost'];
            }
        }
        return ['labels'=>$labels, 'values'=>$values];
    }




    public function getSpoilagePie(){
        // Total delivered units from Orderlines.quantity; spoilage from Deliveries.spoilage_quantity
        $delivered_units = $this->scalar("SELECT COALESCE(SUM(quantity),0) FROM Orderlines");
        $spoiled_units   = $this->scalar("SELECT COALESCE(SUM(spoilage_quantity),0) FROM Deliveries");
        if ($delivered_units === null) $delivered_units = 0;
        if ($spoiled_units === null) $spoiled_units = 0;
        $non_spoiled = max(0, $delivered_units - $spoiled_units);

        return [
            'labels' => ['Non-spoiled Units', 'Spoiled Units'],
            'values' => [ (float)$non_spoiled, (float)$spoiled_units ]
        ];
    }
}
