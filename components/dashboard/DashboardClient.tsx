"use client";

import { useState, useEffect, useMemo } from "react";
import { LeafletMap } from "@/components/dashboard/leaflet-map";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopStats } from "@/components/dashboard/top-stats";
import { ChartsSection } from "@/components/dashboard/charts-section";
import { CalendarWidget } from "@/components/dashboard/calendar-widget";
import { SearchFilters } from "@/components/dashboard/search-filters";
import { GridStatus } from "@/components/pages/grid-status";
import { Analytics } from "@/components/pages/analytics";
import { AlertsPage } from "@/components/pages/alerts";
import { UsersPage } from "@/components/pages/users";
import { GridAssetsPage } from "@/components/pages/grid-assets";
import { DeletedAssetsPage } from "@/components/pages/deleted-assets";
import { SettingsPage } from "@/components/pages/settings";
import { AboutPage } from "@/components/pages/about";
import { Toaster } from "@/components/ui/toaster";
import { convertToEthiopianGridAssets, ProcessedAsset, loadProcessedAssets, normalizeRegionName } from "@/lib/processed-data";

export default function DashboardClient({
  userRole: initialUserRole,
}: {
  userEmail: string;
  userRole: "admin" | "user";
}) {
  const [userRole, setUserRole] = useState<"admin" | "user">(initialUserRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filters, setFilters] = useState({
    region: "",
    assetType: "",
    alertSeverity: "",
    searchQuery: "",
  });
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [gridAssets, setGridAssets] = useState<ProcessedAsset[]>([]);
  const [zoneData, setZoneData] = useState<ProcessedAsset | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGridAssets = async () => {
    try {
      setLoading(true);
      const data = await loadProcessedAssets();
      setGridAssets(data || []);
      setZoneData(null);
    } catch (error) {
      console.error("Failed to load grid assets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedDate(new Date());
    fetchGridAssets();
  }, []);

  const filteredGridAssets = useMemo(() => {
    let data = gridAssets.filter(asset => !asset.deleted)

    // Asset Type filter (global)
    if (filters.assetType) {
      data = data.filter(a => a.source === filters.assetType)
    }

    // Region filter (global)
    if (filters.region) {
      data = data.filter(a => normalizeRegionName(a.region || a.poletical) === filters.region)
    }

    // Alert Severity filter (global)
    if (filters.alertSeverity) {
      const bucket = (a: ProcessedAsset): 'low' | 'medium' | 'high' | 'critical' => {
        if (a.source === 'tower') {
          const s = String(a.status || '').toUpperCase()
          if (s === 'CRITICAL' || s === 'POOR') return 'critical'
          if (s === 'WARNING' || s === 'FAIR') return 'high'
          if (s === 'GOOD' || s === 'EXCELLENT' || s === 'NORMAL') return 'low'
          return 'medium' // for maintenance or other statuses
        }
        const missingVoltage = !(a.voltage_le && a.voltage_le > 0) && !a.voltage_sp
        return missingVoltage ? 'medium' : 'low';
      }
      data = data.filter(a => bucket(a) === filters.alertSeverity)
    }

    return data
  }, [gridAssets, filters])

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-foreground text-xl">Loading Grid Data...</div>
        </div>
      );
    }

    switch (currentPage) {
      case "grid":
        return <GridStatus assets={filteredGridAssets} />;
      case "analytics":
        return <Analytics assets={filteredGridAssets} />;
      case "alerts":
        const ethiopianGridAssets = convertToEthiopianGridAssets(filteredGridAssets);
        return <AlertsPage assets={ethiopianGridAssets} />;
      case "users":
        return <UsersPage />;
      case "grid-assets":
        return <GridAssetsPage gridAssets={gridAssets} fetchGridAssets={fetchGridAssets} />;
      case "deleted-assets":
        return <DeletedAssetsPage fetchGridAssets={fetchGridAssets} />;
      case "settings":
        return <SettingsPage assets={filteredGridAssets} />;
      case "about":
        return <AboutPage assets={filteredGridAssets} />;
      case "map":
        return <LeafletMap assets={filteredGridAssets} zoneData={zoneData} filters={filters} userRole={userRole} />;
      case "dashboard":
      default:
        return (
          <div className="space-y-6">
            <SearchFilters assets={gridAssets} filters={filters as any} onFiltersChange={setFilters as any} userRole={userRole} />
            <TopStats assets={filteredGridAssets} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <ChartsSection filters={filters} selectedDate={selectedDate!} userRole={userRole} />
              </div>
              <div className="space-y-4 md:space-y-6">
                {selectedDate && <CalendarWidget selectedDate={selectedDate} onDateChange={setSelectedDate} assets={filteredGridAssets} />}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        userRole={userRole}
        onRoleChange={setUserRole}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0 md:ml-16"} overflow-auto`}>
        <div className="p-3 md:p-6">{renderCurrentPage()}</div>
      </main>
      <Toaster />
    </div>
  );
}
