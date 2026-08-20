"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  MoreHorizontal,
  List,
  FileDown,
  Printer,
  Info,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompanyForm from "./CompanyForm";

interface Company {
  id: string;
  name: string;
  typeOfCompany: string;
  division: string;
}

const mockCompanies: Company[] = [
  { id: "1", name: "ABC", typeOfCompany: "", division: "" },
  { id: "2", name: "Acme", typeOfCompany: "Consultant", division: "" },
  { id: "3", name: "Duna company", typeOfCompany: "", division: "" },
  { id: "4", name: "Trimble", typeOfCompany: "", division: "" },
  { id: "5", name: "XYZ", typeOfCompany: "Contractor", division: "Concrete" },
];

type SortField = "name" | "typeOfCompany" | "division";
type SortDir = "asc" | "desc";

export default function PSSettingsCompanies() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDivision, setFilterDivision] = useState<string>("all");
  const [filterLabor, setFilterLabor] = useState<string>("all");
  const [filterClassification, setFilterClassification] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [openCompanyId, setOpenCompanyId] = useState<string | null>(null);

  const filteredCompanies = useMemo(() => {
    let result = [...mockCompanies];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.typeOfCompany.toLowerCase().includes(q) ||
          c.division.toLowerCase().includes(q)
      );
    }
    if (filterType && filterType !== "all") {
      result = result.filter((c) => c.typeOfCompany === filterType);
    }
    if (filterDivision && filterDivision !== "all") {
      result = result.filter((c) => c.division === filterDivision);
    }

    result.sort((a, b) => {
      const aVal = a[sortField].toLowerCase();
      const bVal = b[sortField].toLowerCase();
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return result;
  }, [searchQuery, filterType, filterDivision, sortField, sortDir]);

  const allSelected =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((c) => selectedIds.has(c.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCompanies.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterDivision("all");
    setFilterLabor("all");
    setFilterClassification("all");
  };

  const openCompany = openCompanyId
    ? mockCompanies.find((c) => c.id === openCompanyId) ?? null
    : null;

  const openCompanyIndex = openCompany
    ? filteredCompanies.findIndex((c) => c.id === openCompany.id)
    : -1;

  const handleNavigateCompany = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? openCompanyIndex - 1 : openCompanyIndex + 1;
    if (newIndex >= 0 && newIndex < filteredCompanies.length) {
      setOpenCompanyId(filteredCompanies[newIndex].id);
    }
  };

  if (openCompany) {
    return (
      <CompanyForm
        company={openCompany}
        companyIndex={openCompanyIndex}
        totalCompanies={filteredCompanies.length}
        onClose={() => setOpenCompanyId(null)}
        onNavigate={handleNavigateCompany}
      />
    );
  }

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top action bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
          <div className="text-primary text-sm font-medium">
            Viewing {filteredCompanies.length} Companies
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 rounded-full">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Default view
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full">
              Group
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 rounded-full">
              Name
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Secondary toolbar */}
        <div className="flex items-center justify-end px-4 py-1.5 border-b border-border bg-background">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <FileDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Info className="h-4 w-4" />
            </Button>
            <Button size="sm" className="ml-2 h-7 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background border-b border-border">
              <tr>
                <th className="w-10 px-4 py-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left px-4 py-2 font-medium text-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-2 font-medium text-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("typeOfCompany")}
                  >
                    Type of company
                  </button>
                </th>
                <th className="text-left px-4 py-2 font-medium text-foreground">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("division")}
                  >
                    Division
                  </button>
                </th>
                <th className="w-10 px-2 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Manage columns</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setOpenCompanyId(company.id)}
                >
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(company.id)}
                      onCheckedChange={() => toggleOne(company.id)}
                    />
                  </td>
                  <td className="px-4 py-2 text-foreground">{company.name}</td>
                  <td className="px-4 py-2 text-foreground">
                    {company.typeOfCompany}
                  </td>
                  <td className="px-4 py-2 text-foreground">
                    {company.division}
                  </td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right filter panel */}
      {isFilterOpen && (
        <div className="w-60 border-l border-border bg-background flex flex-col flex-none">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="px-3 pb-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              By
            </div>
            <div className="space-y-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Type of company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Type of company</SelectItem>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDivision} onValueChange={setFilterDivision}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Division</SelectItem>
                  <SelectItem value="Concrete">Concrete</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterLabor} onValueChange={setFilterLabor}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Types of labor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Types of labor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClassification} onValueChange={setFilterClassification}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Classifications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-auto p-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={resetFilters}
            >
              Reset search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
