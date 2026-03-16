"use client";


import React, { useMemo, useState } from "react";
import { Truck, Mountain, Package, Clock3, Calculator, Plus, Trash2, Settings2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialQuarries = [
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
      { id: "m5", name: "1 in. Clean", pricePerTon: 25, taxable: true },
    ],
  },
];

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export default function HaulYeahLoadCalcApp() {
  const [hourlyRate, setHourlyRate] = useState("125");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("30");
  const [tons, setTons] = useState("20");
  const [truckCapacity, setTruckCapacity] = useState("10");
  const [taxRate, setTaxRate] = useState("6");
  const [applyTax, setApplyTax] = useState(true);

  const [quarries, setQuarries] = useState(initialQuarries);
  const [selectedQuarryId, setSelectedQuarryId] = useState(initialQuarries[0].id);
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialQuarries[0].materials[0].id);
  const [priceOverride, setPriceOverride] = useState("");

  const selectedQuarry = useMemo(
    () => quarries.find((q) => q.id === selectedQuarryId) || quarries[0],
    [quarries, selectedQuarryId]
  );

  const selectedMaterial = useMemo(() => {
    return selectedQuarry?.materials.find((m) => m.id === selectedMaterialId) || selectedQuarry?.materials[0];
  }, [selectedQuarry, selectedMaterialId]);

  const effectivePricePerTon = priceOverride !== "" ? Number(priceOverride) || 0 : selectedMaterial?.pricePerTon || 0;

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
  }, [hourlyRate, hours, minutes, tons, truckCapacity, effectivePricePerTon, applyTax, selectedMaterial, taxRate]);

  const quoteCardText = `${tons || 0} Tons ${selectedMaterial?.name || "Material"}\n${selectedQuarry?.name || "Quarry"}\nGrand Total: ${money(calc.grandTotal)}`;

  const addQuarry = () => {
    const id = `q${Date.now()}`;
    const newQuarry = {
      id,
      name: `New Quarry ${quarries.length + 1}`,
      materials: [{ id: `m${Date.now()}`, name: "New Material", pricePerTon: 0, taxable: true }],
    };
    setQuarries((prev) => [...prev, newQuarry]);
    setSelectedQuarryId(id);
    setSelectedMaterialId(newQuarry.materials[0].id);
  };

  const updateQuarryName = (id: string, name: string) => {
    setQuarries((prev) => prev.map((q) => (q.id === id ? { ...q, name } : q)));
  };

  const addMaterial = (quarryId: string) => {
    const material = { id: `m${Date.now()}`, name: "New Material", pricePerTon: 0, taxable: true };
    setQuarries((prev) =>
      prev.map((q) => (q.id === quarryId ? { ...q, materials: [...q.materials, material] } : q))
    );
  };

  const updateMaterial = (quarryId: string, materialId: string, patch: Partial<{ name: string; pricePerTon: number; taxable: boolean }>) => {
    setQuarries((prev) =>
      prev.map((q) =>
        q.id === quarryId
          ? {
              ...q,
              materials: q.materials.map((m) => (m.id === materialId ? { ...m, ...patch } : m)),
            }
          : q
      )
    );
  };

  const removeMaterial = (quarryId: string, materialId: string) => {
    setQuarries((prev) =>
      prev.map((q) => {
        if (q.id !== quarryId) return q;
        const nextMaterials = q.materials.filter((m) => m.id !== materialId);
        return { ...q, materials: nextMaterials.length ? nextMaterials : q.materials };
      })
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-md p-4 md:max-w-6xl md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-orange-500/15 p-3 ring-1 ring-orange-500/25">
            <Truck className="h-7 w-7 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">HaulYeah LoadCalc</h1>
            <p className="text-sm text-zinc-400">Dump truck haul and material calculator</p>
          </div>
        </div>

        <Tabs defaultValue="calculator" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-zinc-900">
            <TabsTrigger value="calculator" className="rounded-xl">Calculator</TabsTrigger>
            <TabsTrigger value="setup" className="rounded-xl">Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4">
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Clock3 className="h-5 w-5 text-orange-500" /> Haul</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Hourly Rate</Label>
                  <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} inputMode="decimal" className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>
                <div>
                  <Label>Hours</Label>
                  <Input value={hours} onChange={(e) => setHours(e.target.value)} inputMode="numeric" className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>
                <div>
                  <Label>Minutes</Label>
                  <Input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="numeric" className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>
                <div className="col-span-2 rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                  <div className="text-sm text-zinc-400">Haul Bill</div>
                  <div className="mt-1 text-3xl font-bold text-orange-500">{money(calc.haulBill)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Mountain className="h-5 w-5 text-orange-500" /> Material</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quarry</Label>
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
                    <SelectTrigger className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {quarries.map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Material</Label>
                  <Select value={selectedMaterialId} onValueChange={(value) => {
                    setSelectedMaterialId(value);
                    setPriceOverride("");
                  }}>
                    <SelectTrigger className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {selectedQuarry?.materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tons</Label>
                    <Input value={tons} onChange={(e) => setTons(e.target.value)} inputMode="decimal" className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                  </div>
                  <div>
                    <Label>Price / Ton</Label>
                    <Input value={priceOverride !== "" ? priceOverride : String(selectedMaterial?.pricePerTon ?? 0)} onChange={(e) => setPriceOverride(e.target.value)} inputMode="decimal" className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                  <div className="text-sm text-zinc-400">Material Cost</div>
                  <div className="mt-1 text-3xl font-bold text-orange-500">{money(calc.materialCost)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Calculator className="h-5 w-5 text-orange-500" /> Total</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                  <div>
                    <Label className="text-base">Apply Sales Tax</Label>
                    <p className="text-sm text-zinc-400">Tax applies to material only</p>
                  </div>
                  <Switch checked={applyTax} onCheckedChange={setApplyTax} />
                </div>

                <div>
                  <Label>Tax Rate %</Label>
                  <Input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Loads</div>
                    <div className="mt-1 text-xl font-semibold">{calc.loads}</div>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4 ring-1 ring-zinc-800">
                    <div className="text-zinc-400">Cost / Ton</div>
                    <div className="mt-1 text-xl font-semibold">{money(calc.costPerTon)}</div>
                  </div>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-black shadow-xl">
                  <div className="text-sm font-medium opacity-80">Grand Total</div>
                  <div className="mt-1 text-4xl font-black tracking-tight">{money(calc.grandTotal)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-orange-500/20 bg-zinc-900/80 shadow-2xl shadow-black/20">
              <CardHeader>
                <CardTitle className="text-lg">Customer Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl border border-orange-500/20 bg-black p-6 text-center shadow-inner">
                  <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">HaulYeah LoadCalc</div>
                  <div className="mt-4 text-xl font-semibold text-white">{tons || 0} Tons {selectedMaterial?.name || "Material"}</div>
                  <div className="mt-1 text-zinc-400">{selectedQuarry?.name || "Quarry"}</div>
                  <div className="mt-6 text-sm text-zinc-500">Delivered Total</div>
                  <div className="mt-1 text-5xl font-black tracking-tight text-orange-500">{money(calc.grandTotal)}</div>
                  <div className="mt-5 text-xs text-zinc-500">Built for fast screenshots and texting. Because apparently that still beats half the software on earth.</div>
                </div>
                <div className="mt-4 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400 ring-1 ring-zinc-800 whitespace-pre-line">{quoteCardText}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Card className="rounded-3xl border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Settings2 className="h-5 w-5 text-orange-500" /> Defaults</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Default Hourly Rate</Label>
                  <Input value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>
                <div>
                  <Label>Default Tax Rate %</Label>
                  <Input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>
                <div>
                  <Label>Truck Capacity Tons</Label>
                  <Input value={truckCapacity} onChange={(e) => setTruckCapacity(e.target.value)} className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={addQuarry} className="rounded-2xl bg-orange-500 text-black hover:bg-orange-400"><Plus className="mr-2 h-4 w-4" />Add Quarry</Button>
            </div>

            {quarries.map((quarry) => (
              <Card key={quarry.id} className="rounded-3xl border-zinc-800 bg-zinc-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Mountain className="h-5 w-5 text-orange-500" /> Quarry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quarry Name</Label>
                    <Input value={quarry.name} onChange={(e) => updateQuarryName(quarry.id, e.target.value)} className="mt-2 rounded-2xl border-zinc-700 bg-zinc-950" />
                  </div>

                  <div className="space-y-3">
                    {quarry.materials.map((material) => (
                      <div key={material.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div>
                            <Label>Material</Label>
                            <Input value={material.name} onChange={(e) => updateMaterial(quarry.id, material.id, { name: e.target.value })} className="mt-2 rounded-2xl border-zinc-700 bg-zinc-900" />
                          </div>
                          <div>
                            <Label>Price / Ton</Label>
                            <Input value={material.pricePerTon} onChange={(e) => updateMaterial(quarry.id, material.id, { pricePerTon: Number(e.target.value) || 0 })} className="mt-2 rounded-2xl border-zinc-700 bg-zinc-900" />
                          </div>
                          <div className="flex items-end justify-between rounded-2xl bg-zinc-900 p-4 ring-1 ring-zinc-800">
                            <div>
                              <Label>Taxable</Label>
                              <p className="text-xs text-zinc-400">Material tax toggle</p>
                            </div>
                            <Switch checked={material.taxable} onCheckedChange={(checked) => updateMaterial(quarry.id, material.id, { taxable: checked })} />
                          </div>
                          <div className="flex items-end">
                            <Button variant="outline" onClick={() => removeMaterial(quarry.id, material.id)} className="w-full rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"><Trash2 className="mr-2 h-4 w-4" />Remove</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="secondary" onClick={() => addMaterial(quarry.id)} className="rounded-2xl bg-zinc-800 text-white hover:bg-zinc-700"><Plus className="mr-2 h-4 w-4" />Add Material</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
