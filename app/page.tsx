// FULL UPDATED FILE — use this one, not the previous

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Mountain,
  Clock3,
  Calculator,
  Plus,
  Trash2,
  Settings2,
  RotateCcw,
  Expand,
  ArrowLeft,
  Eraser,
  Save,
  Archive,
  FolderOpen,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- TYPES ---
type Material = {
  id: string;
  name: string;
  pricePerTon: number;
  taxable: boolean;
};

type Quarry = {
  id: string;
  name: string;
  materials: Material[];
};

type MaterialLine = {
  id: string;
  quarryId: string;
  materialId: string;
  tons: string;
  priceOverride: string;
};

type SavedQuote = {
  id: string;
  customerName: string;
  savedAt: string;
  hoursPerLoad: string;
  materialLines: MaterialLine[];
  total: number;
};

// --- CONSTANTS ---
const STORAGE_KEY = "haulyeah-v3";
const ARCHIVE_KEY = "haulyeah-archive-v1";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v || 0);

const makeLine = (): MaterialLine => ({
  id: Date.now().toString(),
  quarryId: "q1",
  materialId: "m1",
  tons: "20",
  priceOverride: "",
});

// --- APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState("calculator");

  const [customerName, setCustomerName] = useState("");
  const [hoursPerLoad, setHoursPerLoad] = useState("1.7");
  const [hourlyRate, setHourlyRate] = useState("175");
  const [truckCapacity, setTruckCapacity] = useState("10");

  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([makeLine()]);
  const [archive, setArchive] = useState<SavedQuote[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // --- LOAD ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const d = JSON.parse(saved);
      setCustomerName(d.customerName || "");
      setHoursPerLoad(d.hoursPerLoad || "1.7");
      setHourlyRate(d.hourlyRate || "175");
      setTruckCapacity(d.truckCapacity || "10");
      setMaterialLines(d.materialLines || [makeLine()]);
    }

    const a = localStorage.getItem(ARCHIVE_KEY);
    if (a) setArchive(JSON.parse(a));
  }, []);

  // --- SAVE ---
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ customerName, hoursPerLoad, hourlyRate, truckCapacity, materialLines })
    );
  }, [customerName, hoursPerLoad, hourlyRate, truckCapacity, materialLines]);

  useEffect(() => {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
  }, [archive]);

  // --- CALC ---
  const calc = useMemo(() => {
    const totalTons = materialLines.reduce((s, l) => s + (Number(l.tons) || 0), 0);
    const loads = Math.ceil(totalTons / (Number(truckCapacity) || 1));

    const haulPerLoad = (Number(hoursPerLoad) || 0) * (Number(hourlyRate) || 0);
    const haulTotal = haulPerLoad * loads;

    const materialTotal = materialLines.reduce((s, l) => {
      const tons = Number(l.tons) || 0;
      const price = Number(l.priceOverride) || 0;
      return s + tons * price;
    }, 0);

    return {
      totalTons,
      loads,
      haulPerLoad,
      haulTotal,
      materialTotal,
      grand: haulTotal + materialTotal,
    };
  }, [materialLines, hoursPerLoad, hourlyRate, truckCapacity]);

  // --- ACTIONS ---
  const saveQuote = () => {
    const q: SavedQuote = {
      id: Date.now().toString(),
      customerName,
      savedAt: new Date().toISOString(),
      hoursPerLoad,
      materialLines,
      total: calc.grand,
    };
    setArchive((p) => [q, ...p]);
  };

  const loadQuote = (q: SavedQuote) => {
    setCustomerName(q.customerName);
    setHoursPerLoad(q.hoursPerLoad);
    setMaterialLines(q.materialLines);
    setActiveTab("calculator");
  };

  const clear = () => {
    setCustomerName("");
    setMaterialLines([makeLine()]);
  };

  return (
    <div className="p-4 text-white">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card>
            <CardContent className="space-y-4">
              <Input ref={inputRef} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer" />

              <Input value={hoursPerLoad} onChange={(e) => setHoursPerLoad(e.target.value)} placeholder="Hours per load" />

              <div className="text-sm text-gray-400">
                Using truck capacity: {truckCapacity} tons
              </div>

              <div className="text-lg">Loads: {calc.loads}</div>
              <div>Haul Total: {money(calc.haulTotal)}</div>
              <div>Material: {money(calc.materialTotal)}</div>

              <div className="text-2xl text-orange-500">
                {money(calc.grand)}
              </div>

              <Button onClick={saveQuote}>Save</Button>
              <Button onClick={clear}>New</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive">
          {archive.map((q) => (
            <div key={q.id} className="border p-2 mb-2">
              <div>{q.customerName}</div>
              <div>{money(q.total)}</div>
              <Button onClick={() => loadQuote(q)}>Load</Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="setup">
          <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="Hourly Rate" />
          <Input value={truckCapacity} onChange={(e) => setTruckCapacity(e.target.value)} placeholder="Truck Capacity" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
