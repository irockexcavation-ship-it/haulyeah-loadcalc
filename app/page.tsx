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
  Download,
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

const initialQuarries: Quarry[] = [
  {
    id: "q1",
    name: "Mulzer",
    materials: [
      { id: "m1", name: "DGA", pricePerTon: 18, taxable: true },
      { id: "m2", name: "#57 Stone", pricePerTon: 24, taxable: true },
      { id: "m3", name: "#3 Stone", pricePerTon: 22, taxable: true },
    ],
  },
  {
    id: "q2",
    name: "Rogers Group",
    materials: [
      { id: "m4", name: "Dense Grade", pricePerTon: 19, taxable: true },
      { id: "m5", name: '1" Clean', pricePerTon: 25, taxable: true },
    ],
  },
];

const STORAGE_KEY = "haulyeah-loadcalc-data-v1";
const QUICK_TON_OPTIONS = [10, 15, 20, 25, 30];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function HaulYeahLoadCalcApp() {
  const [customerName, setCustomerName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("125");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("30");
  const [tons, setTons] = useState("20");
  const [truckCapacity, setTruckCapacity] = useState("10");
  const [taxRate, setTaxRate] = useState("6");
  const [applyTax, setApplyTax] = useState(true);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  const [quarries, setQuarries] = useState<Quarry[]>(initialQuarries);
  const [selectedQuarryId, setSelectedQuarryId] = useState(initialQuarries[0].id);
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    initialQuarries[0].materials[0].id
  );
  const [priceOverride, setPriceOverride] = useState("");

  const customerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      if (data.customerName !== undefined) setCustomerName(data.customerName);
      if (data.hourlyRate !== undefined) setHourlyRate(data.hourlyRate);
      if (data.hours !== undefined) setHours(data.hours);
      if (data.minutes !== undefined) setMinutes(data.minutes);
      if (data.tons !== undefined) setTons(data.tons);
      if (data.truckCapacity !== undefined) setTruckCapacity(data.truckCapacity);
      if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      if (data.applyTax !== undefined) setApplyTax(data.applyTax);
      if (data.quarries !== undefined) setQuarries(data.quarries);
      if (data.selectedQuarryId !== undefined) setSelectedQuarryId(data.selectedQuarryId);
      if (data.selectedMaterialId !== undefined) {
        setSelectedMaterialId(data.selectedMaterialId);
      }
      if (data.priceOverride !== undefined) setPriceOverride(data.priceOverride);
    } catch (error) {
      console.error("Failed to load saved calculator data", error);
    }
  }, []);

  useEffect(() => {
    const data = {
      customerName,
      hourlyRate,
      hours,
      minutes,
      tons,
      truckCapacity,
      taxRate,
      applyTax,
      quarries,
      selectedQuarryId,
      selectedMaterialId,
      priceOverride,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [
    customerName,
    hourlyRate,
    hours,
    minutes,
    tons,
    truckCapacity,
    taxRate,
    applyTax,
    quarries,
    selectedQuarryId,
    selectedMaterialId,
    priceOverride,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      customerInputRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
    };
  }, []);

  const selectedQuarry = useMemo(
    () => quarries.find((q) => q.id === selectedQuarryId) || quarries[0],
    [quarries, selectedQuarryId]
  );

  const selectedMaterial = useMemo(() => {
    return (
      selectedQuarry?.materials.find((m) => m.id === selectedMaterialId) ||
      selectedQuarry?.materials[0]
    );
  }, [selectedQuarry, selectedMaterialId]);

  const effectivePricePerTon =
    priceOverride !== "" ? Number(priceOverride) || 0 : selectedMaterial?.pricePerTon || 0;

  const calc = useMemo(() => {
    const rate = Number(hourlyRate) || 0;
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalTons = Number(tons) || 0;
    const capacity = Number(truckCapacity) || 0;
    const totalHours = h + m / 60;
    const haulBill = rate * totalHours;
    const materialCost = totalTons * effectivePricePerTon;
    const taxable = applyTax && (selectedMaterial?.taxable ?? true);
    const taxAmount = taxable ? materialCost * ((Number(taxRate) || 0) / 100) : 0;
    const grandTotal = haulBill + materialCost + taxAmount;
    const loads = capacity > 0 ? Math.ceil(totalTons / capacity) : 0;
    const costPerTon = totalTons > 0 ? grandTotal / totalTons : 0;

    return {
      totalHours: round2(totalHours),
      haulBill: round2(haulBill),
      materialCost: round2(materialCost),
      taxAmount: round2(taxAmount),
      grandTotal: round2(grandTotal),
      loads,
      costPerTon: round2(costPerTon),
    };
  }, [
    hourlyRate,
    hours,
    minutes,
    tons,
    truckCapacity,
    effectivePricePerTon,
    applyTax,
    selectedMaterial,
    taxRate,
  ]);

  const addQuarry = () => {
    const now = Date.now();
    const quarryId = `q${now}`;
    const materialId = `m${now}`;

    const newQuarry: Quarry = {
      id: quarryId,
      name: "New Quarry",
      materials: [
        {
          id: materialId,
          name: "New Material",
          pricePerTon: 0,
          taxable: true,
        },
      ],
    };

    setQuarries((prev) => [newQuarry, ...prev]);
    setSelectedQuarryId(quarryId);
    setSelectedMaterialId(materialId);
    setPriceOverride("");

    setTimeout(() => {
      const el = document.getElementById(`quarry-card-${quarryId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const updateQuarryName = (id: string, name: string) => {
    setQuarries((prev) => prev.map((q) => (q.id === id ? { ...q, name } : q)));
  };

  const addMaterial = (quarryId: string) => {
    const material: Material = {
      id: `m${Date.now()}`,
      name: "New Material",
      pricePerTon: 0,
      taxable: true,
    };

    setQuarries((prev) =>
      prev.map((q) =>
        q.id === quarryId ? { ...q, materials: [...q.materials, material] } : q
      )
    );
  };

  const updateMaterial = (
    quarryId: string,
    materialId: string,
    patch: Partial<Material>
  ) => {
    setQuarries((prev) =>
      prev.map((q) =>
        q.id === quarryId
          ? {
              ...q,
              materials: q.materials.map((m) =>
                m.id === materialId ? { ...m, ...patch } : m
              ),
            }
          : q
      )
    );
  };

  const removeMaterial = (quarryId: string, materialId: string) => {
    setQuarries((prev) =>
      prev.map((q) => {
        if (q.id !== quarryId) return q;
        if (q.materials.length <= 1) return q;

        const nextMaterials = q.materials.filter((m) => m.id !== materialId);
        return { ...q, materials: nextMaterials };
      })
    );

    if (selectedMaterialId === materialId) {
      const currentQuarry = quarries.find((q) => q.id === quarryId);
      const nextMaterial = currentQuarry?.materials.find((m) => m.id !== materialId);
      if (nextMaterial) {
        setSelectedMaterialId(nextMaterial.id);
        setPriceOverride("");
      }
    }
  };

  const resetSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomerName("");
    setHourlyRate("125");
    setHours("1");
    setMinutes("30");
    setTons("20");
    setTruckCapacity("10");
    setTaxRate("6");
    setApplyTax(true);
    setSnapshotMode(false);
    setQuarries(initialQuarries);
    setSelectedQuarryId(initialQuarries[0].id);
    setSelectedMaterialId(initialQuarries[0].materials[0].id);
    setPriceOverride("");
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const customerSnapshotLine1 = customerName.trim() || "Customer";
  const customerSnapshotLine2 = `${tons || 0} Tons ${selectedMaterial?.name || "Material"}`;
  const customerSnapshotLine3 = selectedQuarry?.name || "Quarry";

  const SnapshotCard = ({ fullScreen = false }: { fullScreen?: boolean }) => (
    <div
      className={`rounded-3xl border border-orange-500/30 bg-gradient-to-b from-zinc-950 to-black text-center shadow-2xl ${
        fullScreen ? "p-8 min-h-[70vh] flex flex-col justify-center" : "p-6"
      }`}
    >
      <div className="mb-6 h-2 w-full rounded-full bg-orange-500"></div>

      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/15 ring-1 ring-orange-500/25 md:h-24 md:w-24">
        <img
          src="/haulyeah-icon.png"
          alt="HaulYeah icon"
          className="h-14 w-14 object-contain md:h-16 md:w-16"
        />
      </div>

      <div className="text-xl font-bold tracking-tight text-white md:text-2xl">
        HaulYeah LoadCalc
      </div>

      <div className="mt-6 text-sm text-zinc-500">Quoted For</div>
      <div className="mt-2 text-3xl font-semibold text-white md:text-4xl">
        {customerSnapshotLine1}
      </div>

      <div className="mx-auto mt-4 h-px w-40 bg-zinc-700"></div>

      <div className="mt-8 text-4xl font-bold text-white md:text-5xl">
        {customerSnapshotLine2}
      </div>

      <div className="mt-3 text-2xl text-zinc-400 md:text-3xl">
        {customerSnapshotLine3}
      </div>

      <div className="mt-10 text-sm text-zinc-500 md:text-base">
        Delivered Price Quote
      </div>

      <div className="mt-2 text-7xl font-black tracking-tight text-orange-500 md:text-8xl">
        {money(calc.grandTotal)}
      </div>

      <div className="mt-6 text-sm text-zinc-500">
        Generated by HaulYeah LoadCalc
      </div>

      <div className="mt-3 text-xs text-zinc-500 md:text-sm">
        Includes haul, material, and tax if applied.
      </div>
    </div>
  );

  if (snapshotMode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-3xl p-4 md:p-8">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Button
              type="button"
              onClick={() => setSnapshotMode(false)}
              variant="outline"
              className="rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calculator
            </Button>
            <div className="text-sm text-zinc-400">Opened for a clean screenshot.</div>
          </div>

          <SnapshotCard fullScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-md p-4 md:max-w-6xl md:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-orange-500/15 ring-1 ring-orange-500/25 md:h-24 md:w-24">
            <img
              src="/haulyeah-icon.png"
              alt="HaulYeah icon"
              className="h-14 w-14 object-contain md:h-16 md:w-16"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              HaulYeah LoadCalc
            </div>
            <p className="mt-1 text-sm text-zinc-300 md:text-base">
              Dump truck haul and material calculator
            </p>
          </div>
        </div>

        {showInstall && (
          <Card className="mb-4 rounded-3xl border-orange-500/20 bg-zinc-900/80 shadow-2xl shadow-black/20">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-base font-semibold text-white">
                  Install HaulYeah LoadCalc
                </div>
                <div className="text-sm text-zinc-400">
                  Add it to your home screen for a real app feel.
                </div>
              </div>
              <Button
                type="button"
                onClick={handleInstall}
                className="rounded-2xl bg-orange-500 text-black hover:bg-orange-400"
              >
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="calculator" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-zinc-900 text-white">
            <TabsTrigger
              value="calculator"
              className="rounded-xl text-white data-[state=active]:bg-orange-500 data-[state=active]:text-black"
            >
              Calculator
            </TabsTrigger>
            <TabsTrigger
              value="setup"
              className="rounded-xl text-white data-[state=active]:bg-orange-500 data-[state=active]:text-black"
            >
              Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4">
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg text-white">Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-zinc-200">Customer Name</Label>
                  <Input
                    ref={customerInputRef}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Clock3 className="h-5 w-5 text-orange-500" />
                  Haul
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-200">Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    inputMode="numeric"
                    className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Minutes</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    inputMode="numeric"
                    className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>

                <div className="col-span-2 text-sm text-zinc-400">
                  Using saved haul rate:{" "}
                  <span className="text-zinc-200">{money(Number(hourlyRate) || 0)}/hr</span>
                </div>

                <div className="col-span-2 rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                  <div className="text-sm text-zinc-400">Haul Bill</div>
                  <div className="mt-1 text-3xl font-bold text-orange-500">
                    {money(calc.haulBill)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Mountain className="h-5 w-5 text-orange-500" />
                  Material
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-zinc-200">Quarry</Label>
                  <Select
                    value={selectedQuarryId}
                    onValueChange={(value) => {
                      setSelectedQuarryId(value);
                      const nextQuarry = quarries.find((q) => q.id === value);
                      if (nextQuarry?.materials?.[0]) {
                        setSelectedMaterialId(nextQuarry.materials[0].id);
                        setPriceOverride("");
                      }
                    }}
                  >
                    <SelectTrigger className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quarries.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-200">Material</Label>
                  <Select
                    value={selectedMaterialId}
                    onValueChange={(value) => {
                      setSelectedMaterialId(value);
                      setPriceOverride("");
                    }}
                  >
                    <SelectTrigger className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedQuarry?.materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-200">Quick Tons</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_TON_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant="outline"
                        onClick={() => setTons(String(option))}
                        className="rounded-2xl border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-800"
                      >
                        {option} tons
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-200">Tons</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tons}
                      onChange={(e) => setTons(e.target.value)}
                      inputMode="decimal"
                      className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-zinc-200">Price / Ton</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        priceOverride !== ""
                          ? priceOverride
                          : String(selectedMaterial?.pricePerTon ?? 0)
                      }
                      onChange={(e) => setPriceOverride(e.target.value)}
                      inputMode="decimal"
                      className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                  <div className="text-sm text-zinc-400">Material Cost</div>
                  <div className="mt-1 text-3xl font-bold text-orange-500">
                    {money(calc.materialCost)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Calculator className="h-5 w-5 text-orange-500" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                  <div>
                    <Label className="text-base text-zinc-200">Apply Sales Tax</Label>
                    <p className="text-sm text-zinc-400">
                      Using saved tax rate: {taxRate}%
                    </p>
                  </div>
                  <Switch checked={applyTax} onCheckedChange={setApplyTax} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Loads</div>
                    <div className="mt-1 text-xl font-semibold">{calc.loads}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Cost / Ton</div>
                    <div className="mt-1 text-xl font-semibold">
                      {money(calc.costPerTon)}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-black shadow-xl">
                  <div className="text-sm font-medium opacity-80">
                    Delivered Price Quote
                  </div>
                  <div className="mt-1 text-4xl font-black tracking-tight">
                    {money(calc.grandTotal)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-orange-500/20 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <CardTitle className="text-lg text-white">Customer Snapshot</CardTitle>
                  <p className="text-sm text-zinc-400">
                    Open the clean view for an easy screenshot.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setSnapshotMode(true)}
                  className="rounded-2xl bg-orange-500 text-black hover:bg-orange-400"
                >
                  <Expand className="mr-2 h-4 w-4" />
                  View Snapshot
                </Button>
              </CardHeader>
              <CardContent>
                <SnapshotCard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Settings2 className="h-5 w-5 text-orange-500" />
                  Defaults
                </CardTitle>
                <Button
                  onClick={resetSavedData}
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Saved Data
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-zinc-200">Default Hourly Rate</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Default Tax Rate %</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>

                <div>
                  <Label className="text-zinc-200">Truck Capacity Tons</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={truckCapacity}
                    onChange={(e) => setTruckCapacity(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={addQuarry}
                type="button"
                className="rounded-2xl bg-orange-500 text-black hover:bg-orange-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Quarry
              </Button>
            </div>

            {quarries.map((quarry) => (
              <Card
                key={quarry.id}
                id={`quarry-card-${quarry.id}`}
                className={`rounded-3xl border bg-zinc-900/80 ${
                  quarry.id === selectedQuarryId
                    ? "border-orange-500 shadow-lg shadow-orange-500/10"
                    : "border-zinc-800"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Mountain className="h-5 w-5 text-orange-500" />
                    Quarry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-zinc-200">Quarry Name</Label>
                    <Input
                      value={quarry.name}
                      onChange={(e) => updateQuarryName(quarry.id, e.target.value)}
                      className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                    />
                  </div>

                  <div className="space-y-3">
                    {quarry.materials.map((material) => (
                      <div
                        key={material.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div>
                            <Label className="text-zinc-200">Material</Label>
                            <Input
                              value={material.name}
                              onChange={(e) =>
                                updateMaterial(quarry.id, material.id, {
                                  name: e.target.value,
                                })
                              }
                              className="mt-2 rounded-2xl border-zinc-700 bg-zinc-900 text-white"
                            />
                          </div>

                          <div>
                            <Label className="text-zinc-200">Price / Ton</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={material.pricePerTon}
                              onChange={(e) =>
                                updateMaterial(quarry.id, material.id, {
                                  pricePerTon: Number(e.target.value) || 0,
                                })
                              }
                              inputMode="decimal"
                              className="mt-2 rounded-2xl border-zinc-700 bg-zinc-900 text-white"
                            />
                          </div>

                          <div className="flex items-end justify-between rounded-2xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
                            <div>
                              <Label className="text-zinc-200">Taxable</Label>
                              <p className="text-xs text-zinc-400">Material tax toggle</p>
                            </div>
                            <Switch
                              checked={material.taxable}
                              onCheckedChange={(checked) =>
                                updateMaterial(quarry.id, material.id, { taxable: checked })
                              }
                            />
                          </div>

                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              onClick={() => removeMaterial(quarry.id, material.id)}
                              type="button"
                              className="w-full rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => addMaterial(quarry.id)}
                    type="button"
                    className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-10 text-center text-xs text-zinc-500">
          Powered by <span className="font-semibold text-orange-500">QuoteSnap Tools</span>
        </div>
      </div>
    </div>
  );
}