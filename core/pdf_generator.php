<?php
require("fpdf186/fpdf.php");

class PDFGenerator extends FPDF {
    public $title = "";

    function Header() {
        $this->SetFont("Arial","B",15);
        $this->Cell(80);
        $this->Cell(30,10,$this->title,0,0,"C");
        $this->Ln(20);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont("Arial","I",8);
        $this->Cell(0,10,"Page " . $this->PageNo() . "/{nb}",0,0,"C");
    }

    function generateTablePDF($data, $headers, $title = "Report") {
        $this->title = $title;
        $this->SetTitle($title);
        $this->AliasNbPages();
        $this->AddPage();

        $this->SetFont("Arial","B",12);
        $this->Ln(5);

        $this->SetFillColor(200,220,255);
        $this->SetTextColor(0);
        $this->SetDrawColor(0,0,0);
        $this->SetLineWidth(.3);
        $this->SetFont("","B");

        // Set default column widths
        $w = array_fill(0, count($headers), 40);
        switch ($title) {
            case "Agricultural Product Records Report": $w = [20, 40, 30, 30, 30, 30]; break;
            case "Stock Monitoring Report": $w = [30, 40, 30, 30, 30, 30]; break;
            case "Transportation Planning Report": 
            case "Shipment Tracking Report": $w = [20, 30, 30, 30, 30, 30, 30]; break;
            case "Condition Monitoring Report": $w = [20, 25, 25, 25, 35, 30, 30]; break;
            case "Document Management Report": $w = [20, 40, 30, 30, 30, 30]; break;
            case "Analytics Report": $w = [40, 40, 40, 40]; break;
        }

        // Ensure column widths match header count
        if (count($w) !== count($headers)) {
            $w = array_fill(0, count($headers), 40);
        }

        // Print table headers
        foreach ($headers as $i => $header) {
            $this->Cell($w[$i],7,$header,1,0,"C",true);
        }
        $this->Ln();

        $this->SetFillColor(224,235,255);
        $this->SetTextColor(0);
        $this->SetFont("");

        $fill = false;
        foreach($data as $row) {
            foreach($headers as $i => $header) {
                // Use isset to avoid undefined index errors
                $cellValue = isset($row[$header]) ? $row[$header] : '';
                $this->Cell($w[$i],6,utf8_decode($cellValue),"LR",0,"L",$fill);
            }
            $this->Ln();
            $fill = !$fill;
        }
        $this->Cell(array_sum($w),0,"","T");
        $this->Output();
    }

    function generateSensorDataPDF($data, $title = "Sensor Data Report") {
        $this->title = $title;
        $this->SetTitle($title);
        $this->AliasNbPages();
        $this->AddPage();

        $this->SetFont("Arial","B",12);
        $this->Ln(5);

        $headers = ["Sensor ID", "Transport ID", "Temp (°C)", "Humidity (%)", "Timestamp", "Location"];
        $w = [25, 30, 30, 30, 45, 30];

        $this->SetFillColor(200,220,255);
        $this->SetTextColor(0);
        $this->SetDrawColor(0,0,0);
        $this->SetLineWidth(.3);
        $this->SetFont("","B");

        foreach ($headers as $i => $header) {
            $this->Cell($w[$i],7,$header,1,0,"C",true);
        }
        $this->Ln();

        $this->SetFillColor(224,235,255);
        $this->SetTextColor(0);
        $this->SetFont("");

        $fill = false;
        foreach($data as $row) {
            $this->Cell($w[0],6,isset($row["sensor_id"]) ? $row["sensor_id"] : "","LR",0,"L",$fill);
            $this->Cell($w[1],6,isset($row["transport_id"]) ? $row["transport_id"] : "","LR",0,"L",$fill);
            $this->Cell($w[2],6,isset($row["temperature"]) ? $row["temperature"] : "","LR",0,"L",$fill);
            $this->Cell($w[3],6,isset($row["humidity"]) ? $row["humidity"] : "","LR",0,"L",$fill);
            $this->Cell($w[4],6,isset($row["timestamp"]) ? $row["timestamp"] : "","LR",0,"L",$fill);
            $this->Cell($w[5],6,isset($row["location"]) ? utf8_decode($row["location"]) : "","LR",0,"L",$fill);
            $this->Ln();
            $fill = !$fill;
        }
        $this->Cell(array_sum($w),0,"","T");
        $this->Output();
    }
}
?>
