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

type MaterialLine = {
  id: string;
  quarryId: string;
  materialId: string;
  tons: string;
  priceOverride: string;
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

const makeDefaultLine = (): MaterialLine => ({
  id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  quarryId: initialQuarries[0].id,
  materialId: initialQuarries[0].materials[0].id,
  tons: "20",
  priceOverride: "",
});

const STORAGE_KEY = "haulyeah-loadcalc-data-v2";
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
  const [truckCapacity, setTruckCapacity] = useState("10");
  const [taxRate, setTaxRate] = useState("6");
  const [applyTax, setApplyTax] = useState(true);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  const [quarries, setQuarries] = useState<Quarry[]>(initialQuarries);
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([makeDefaultLine()]);

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
      if (data.truckCapacity !== undefined) setTruckCapacity(data.truckCapacity);
      if (data.taxRate !== undefined) setTaxRate(data.taxRate);
      if (data.applyTax !== undefined) setApplyTax(data.applyTax);
      if (data.quarries !== undefined) setQuarries(data.quarries);
      if (Array.isArray(data.materialLines) && data.materialLines.length > 0) {
        setMaterialLines(data.materialLines);
      }
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
      truckCapacity,
      taxRate,
      applyTax,
      quarries,
      materialLines,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [
    customerName,
    hourlyRate,
    hours,
    minutes,
    truckCapacity,
    taxRate,
    applyTax,
    quarries,
    materialLines,
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

    setMaterialLines((prev) =>
      prev.map((line) => {
        if (line.quarryId !== quarryId || line.materialId !== materialId) return line;
        const quarry = quarries.find((q) => q.id === quarryId);
        const fallback = quarry?.materials.find((m) => m.id !== materialId);
        if (!fallback) return line;
        return { ...line, materialId: fallback.id, priceOverride: "" };
      })
    );
  };

  const addMaterialLine = () => {
    setMaterialLines((prev) => [...prev, makeDefaultLine()]);
  };

  const removeMaterialLine = (lineId: string) => {
    setMaterialLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== lineId)));
  };

  const updateMaterialLine = (lineId: string, patch: Partial<MaterialLine>) => {
    setMaterialLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const clearForNewCustomer = () => {
    setCustomerName("");
    setHours("1");
    setMinutes("30");
    setApplyTax(true);
    setSnapshotMode(false);
    setMaterialLines([makeDefaultLine()]);
    setTimeout(() => {
      customerInputRef.current?.focus();
    }, 50);
  };

  const resetSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomerName("");
    setHourlyRate("125");
    setHours("1");
    setMinutes("30");
    setTruckCapacity("10");
    setTaxRate("6");
    setApplyTax(true);
    setSnapshotMode(false);
    setQuarries(initialQuarries);
    setMaterialLines([makeDefaultLine()]);
    setTimeout(() => {
      customerInputRef.current?.focus();
    }, 50);
  };

  const lineDetails = useMemo(() => {
    return materialLines.map((line) => {
      const quarry = quarries.find((q) => q.id === line.quarryId) || quarries[0];
      const material = quarry.materials.find((m) => m.id === line.materialId) || quarry.materials[0];

      const tonsValue = Number(line.tons) || 0;
      const pricePerTon =
        line.priceOverride !== "" ? Number(line.priceOverride) || 0 : material?.pricePerTon || 0;
      const lineSubtotal = tonsValue * pricePerTon;
      const lineTaxable = applyTax && (material?.taxable ?? true);
      const lineTax = lineTaxable ? lineSubtotal * ((Number(taxRate) || 0) / 100) : 0;
      const loads = Number(truckCapacity) > 0 ? Math.ceil(tonsValue / (Number(truckCapacity) || 1)) : 0;

      return {
        ...line,
        quarry,
        material,
        tonsValue,
        pricePerTon,
        lineSubtotal: round2(lineSubtotal),
        lineTax: round2(lineTax),
        loads,
      };
    });
  }, [materialLines, quarries, applyTax, taxRate, truckCapacity]);

  const calc = useMemo(() => {
    const rate = Number(hourlyRate) || 0;
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;
    const totalHours = h + m / 60;
    const haulBill = rate * totalHours;

    const materialSubtotal = lineDetails.reduce((sum, line) => sum + line.lineSubtotal, 0);
    const taxAmount = lineDetails.reduce((sum, line) => sum + line.lineTax, 0);
    const totalTons = lineDetails.reduce((sum, line) => sum + line.tonsValue, 0);
    const totalLoads = lineDetails.reduce((sum, line) => sum + line.loads, 0);
    const grandTotal = haulBill + materialSubtotal + taxAmount;
    const costPerTon = totalTons > 0 ? grandTotal / totalTons : 0;

    return {
      totalHours: round2(totalHours),
      haulBill: round2(haulBill),
      materialSubtotal: round2(materialSubtotal),
      taxAmount: round2(taxAmount),
      totalTons: round2(totalTons),
      totalLoads,
      grandTotal: round2(grandTotal),
      costPerTon: round2(costPerTon),
    };
  }, [hourlyRate, hours, minutes, lineDetails]);

  const snapshotMaterialLines = lineDetails
    .filter((line) => line.tonsValue > 0)
    .map((line) => `${round2(line.tonsValue)} Tons ${line.material?.name || "Material"}`);

  const snapshotQuarries = Array.from(
    new Set(lineDetails.map((line) => line.quarry?.name).filter(Boolean))
  );

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
        {customerName.trim() || "Customer"}
      </div>

      <div className="mx-auto mt-4 h-px w-40 bg-zinc-700"></div>

      <div className="mt-8 space-y-2">
        {snapshotMaterialLines.length > 0 ? (
          snapshotMaterialLines.map((text, index) => (
            <div key={`${text}-${index}`} className="text-2xl font-bold text-white md:text-3xl">
              {text}
            </div>
          ))
        ) : (
          <div className="text-2xl font-bold text-white md:text-3xl">0 Tons Material</div>
        )}
      </div>

      <div className="mt-4 space-y-1">
        {snapshotQuarries.map((name) => (
          <div key={name} className="text-lg text-zinc-400 md:text-2xl">
            {name}
          </div>
        ))}
      </div>

      <div className="mt-10 text-sm text-zinc-500 md:text-base">Delivered Price Quote</div>

      <div className="mt-2 text-7xl font-black tracking-tight text-orange-500 md:text-8xl">
        {money(calc.grandTotal)}
      </div>

      <div className="mt-6 text-sm text-zinc-500">Generated by HaulYeah LoadCalc</div>

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
                <div className="text-base font-semibold text-white">Install HaulYeah LoadCalc</div>
                <div className="text-sm text-zinc-400">Add it to your home screen for a real app feel.</div>
              </div>
              <Button
                type="button"
                onClick={handleInstall}
                className="rounded-2xl bg-orange-500 text-black hover:bg-orange-400"
              >
                <Expand className="mr-2 h-4 w-4" />
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg text-white">Customer</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearForNewCustomer}
                  className="rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  New Customer
                </Button>
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
                  <div className="mt-1 text-3xl font-bold text-orange-500">{money(calc.haulBill)}</div>
                </div>
              </CardContent>
            </Card>

            {materialLines.map((line, index) => {
              const quarry = quarries.find((q) => q.id === line.quarryId) || quarries[0];
              const material = quarry.materials.find((m) => m.id === line.materialId) || quarry.materials[0];

              return (
                <Card
                  key={line.id}
                  className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <Mountain className="h-5 w-5 text-orange-500" />
                      Material Line {index + 1}
                    </CardTitle>
                    {materialLines.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeMaterialLine(line.id)}
                        className="rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Line
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-zinc-200">Quarry</Label>
                      <Select
                        value={line.quarryId}
                        onValueChange={(value) => {
                          const nextQuarry = quarries.find((q) => q.id === value) || quarries[0];
                          const nextMaterialId = nextQuarry.materials[0]?.id || "";
                          updateMaterialLine(line.id, {
                            quarryId: value,
                            materialId: nextMaterialId,
                            priceOverride: "",
                          });
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
                        value={line.materialId}
                        onValueChange={(value) =>
                          updateMaterialLine(line.id, { materialId: value, priceOverride: "" })
                        }
                      >
                        <SelectTrigger className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {quarry.materials.map((m) => (
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
                            key={`${line.id}-${option}`}
                            type="button"
                            variant="outline"
                            onClick={() => updateMaterialLine(line.id, { tons: String(option) })}
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
                          value={line.tons}
                          onChange={(e) => updateMaterialLine(line.id, { tons: e.target.value })}
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
                          value={line.priceOverride !== "" ? line.priceOverride : String(material?.pricePerTon ?? 0)}
                          onChange={(e) =>
                            updateMaterialLine(line.id, { priceOverride: e.target.value })
                          }
                          inputMode="decimal"
                          className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950 text-white"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                      <div className="text-sm text-zinc-400">Line Material Cost</div>
                      <div className="mt-1 text-3xl font-bold text-orange-500">
                        {money(
                          (Number(line.tons) || 0) *
                            (line.priceOverride !== ""
                              ? Number(line.priceOverride) || 0
                              : material?.pricePerTon || 0)
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={addMaterialLine}
                className="rounded-2xl bg-orange-500 text-black hover:bg-orange-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Material Line
              </Button>
            </div>

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
                    <p className="text-sm text-zinc-400">Using saved tax rate: {taxRate}%</p>
                  </div>
                  <Switch checked={applyTax} onCheckedChange={setApplyTax} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Total Loads</div>
                    <div className="mt-1 text-xl font-semibold">{calc.totalLoads}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Cost / Ton</div>
                    <div className="mt-1 text-xl font-semibold">{money(calc.costPerTon)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Haul Bill</div>
                    <div className="mt-1 text-xl font-semibold">{money(calc.haulBill)}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Material Subtotal</div>
                    <div className="mt-1 text-xl font-semibold">{money(calc.materialSubtotal)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Total Tons</div>
                    <div className="mt-1 text-xl font-semibold">{calc.totalTons}</div>
                  </div>

                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Tax</div>
                    <div className="mt-1 text-xl font-semibold">{money(calc.taxAmount)}</div>
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-black shadow-xl">
                  <div className="text-sm font-medium opacity-80">Delivered Price Quote</div>
                  <div className="mt-1 text-4xl font-black tracking-tight">{money(calc.grandTotal)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-orange-500/20 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <CardTitle className="text-lg text-white">Customer Snapshot</CardTitle>
                  <p className="text-sm text-zinc-400">Open the clean view for an easy screenshot.</p>
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
                className="rounded-3xl border border-zinc-800 bg-zinc-900/80"
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
