"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, AlertTriangle, CheckCircle, Settings, Search, Info, Download } from "lucide-react"
import type { ProcessedAsset } from "@/lib/processed-data"
import { exportToCSV, getUniqueRegions, normalizeRegionName } from "@/lib/processed-data"

interface GridStatusProps {
  assets: ProcessedAsset[]
}

export function GridStatus({ assets }: GridStatusProps) {
  const [filteredAssets, setFilteredAssets] = useState<ProcessedAsset[]>(assets)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const regionOptions = useMemo(() => getUniqueRegions(assets), [assets])

  useEffect(() => {
    let filtered = assets

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((a) => {
        if (a.source === "tower") {
          return (
            (a.name || "").toLowerCase().includes(q) ||
            (a.site || "").toLowerCase().includes(q) ||
            (a.zone || "").toLowerCase().includes(q) ||
            (a.woreda || "").toLowerCase().includes(q) ||
            (a.category || "").toLowerCase().includes(q)
          )
        } else {
          return (
            (a.name || "").toLowerCase().includes(q) ||
            (a.poletical || "").toLowerCase().includes(q) ||
            String(a.voltage_le || "").toLowerCase().includes(q) ||
            (a.voltage_sp || "").toLowerCase().includes(q)
          )
        }
      })
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.source === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => (a.source === "tower" ? (a.status || "").toLowerCase() === statusFilter : false))
    }

    if (regionFilter !== "all") {
      const region = regionFilter
      filtered = filtered.filter((a) => normalizeRegionName(a.region || a.poletical) === region)
    }

    setFilteredAssets(filtered)
  }, [assets, searchQuery, statusFilter, typeFilter, regionFilter])

  const getStatusIcon = (asset: ProcessedAsset) => {
    if (asset.source === "tower") {
      switch ((asset.status || "").toLowerCase()) {
        case "normal":
        case "good":
          return CheckCircle
        case "warning":
        case "critical":
          return AlertTriangle
        case "maintenance":
          return Settings
        default:
          return Info
      }
    }
    return Zap
  }

  const getStatusBadge = (asset: ProcessedAsset) => {
    if (asset.source !== "tower") return null
    const s = (asset.status || "").toLowerCase()
    const color =
      s === "normal" || s === "good"
        ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/20"
        : s === "warning"
        ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20"
        : s === "critical"
        ? "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20"
        : s === "maintenance"
        ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20"
        : "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20"
    return <Badge className={color}>{asset.status}</Badge>
  }

  const handleExportCSV = () => {
    exportToCSV(filteredAssets, 'grid_status')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Grid Status</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-slate-900 dark:text-white border-slate-300 dark:border-slate-700">
            {filteredAssets.length} Assets
          </Badge>
          <Button onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-slate-400" />
              <Input
                placeholder="Search towers/substations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tower">Electric Towers</SelectItem>
                <SelectItem value="substation">Substations</SelectItem>
                <SelectItem value="generation_plant">Generation Plants</SelectItem>
                <SelectItem value="transmission_line">Transmission Lines</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status (towers)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regionOptions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredAssets.slice(0, 50).map((asset) => {
          const StatusIcon = getStatusIcon(asset)
          return (
            <Card key={asset.id} className="bg-card border-border hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-slate-900 dark:text-white truncate">
                    {asset.name ||
                      (asset.source === "tower"
                        ? "Tower"
                        : asset.source === "substation"
                        ? "Substation"
                        : asset.source === "generation_plant"
                        ? "Generation Plant"
                        : asset.source === "transmission_line"
                        ? "Transmission Line"
                        : "Asset")}
                  </CardTitle>
                  {getStatusBadge(asset)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {/* Always show Type, Address, and Voltage for all asset types */}
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-slate-400">Type:</span>
                    <span className="text-slate-900 dark:text-white">{asset.type || asset.plant_type || asset.source || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-slate-400">Address:</span>
                    <span className="text-slate-900 dark:text-white">{asset.address || asset.poletical || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-slate-400">Elevation (m):</span>
                    <span className="text-slate-900 dark:text-white">{asset.elevation !== undefined ? asset.elevation : '-'}</span>
                  </div>
                  {/* Existing details by type */}
                  {asset.source === "tower" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Zone:</span>
                        <span className="text-slate-900 dark:text-white">{asset.zone || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Woreda:</span>
                        <span className="text-slate-900 dark:text-white">{asset.woreda || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Category:</span>
                        <span className="text-slate-900 dark:text-white">{asset.category || "-"}</span>
                      </div>
                    </>
                  ) : asset.source === "substation" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Poletical:</span>
                        <span className="text-slate-900 dark:text-white">{asset.poletical || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Voltage LE:</span>
                        <span className="text-slate-900 dark:text-white">{asset.voltage_le !== undefined ? `${asset.voltage_le} kV` : "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Voltage SP:</span>
                        <span className="text-slate-900 dark:text-white">{asset.voltage_sp || "-"}</span>
                      </div>
                    </>
                  ) : asset.source === "generation_plant" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Type:</span>
                        <span className="text-slate-900 dark:text-white">{asset.plant_type || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Capacity:</span>
                        <span className="text-slate-900 dark:text-white">{asset.capacity_mw ? `${asset.capacity_mw} MW` : "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Year:</span>
                        <span className="text-slate-900 dark:text-white">{asset.year_operational || "-"}</span>
                      </div>
                    </>
                  ) : asset.source === "transmission_line" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Voltage:</span>
                        <span className="text-slate-900 dark:text-white">{asset.line_voltage ? `${asset.line_voltage} kV` : "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Length:</span>
                        <span className="text-slate-900 dark:text-white">{asset.line_length_km ? `${asset.line_length_km} km` : "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-slate-400">Region:</span>
                        <span className="text-slate-900 dark:text-white">{asset.poletical || "-"}</span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between">
  <span className="text-blue-600 dark:text-slate-400">Lat/Lng:</span>
  <span className="text-slate-900 dark:text-white">
    {asset.lat !== undefined && asset.lng !== undefined
      ? `${asset.lat.toFixed(3)}, ${asset.lng.toFixed(3)}`
      : "N/A"}
  </span>
</div>

                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAssets.length > 50 && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <p className="text-slate-600 dark:text-slate-400">Showing 50 of {filteredAssets.length} assets. Use filters to narrow down results.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
