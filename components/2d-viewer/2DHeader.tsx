"use client";

import React from "react";
import {
  ArrowLeft,
  Printer,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Cloud,
  Search,
  MessageSquare,
  Info,
  HelpCircle,
  Link,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface TwoDHeaderProps {
  onClose?: () => void;
}

export default function TwoDHeader({ onClose }: TwoDHeaderProps) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-2 py-1 border-b bg-background shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => router.push("/field-data?section=site-captures")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">Done</span>

        <div className="flex items-center gap-1 ml-2 border-l pl-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-l pl-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 border-l pl-2">
          <Select defaultValue="sediment">
            <SelectTrigger className="h-8 w-[240px]">
              <SelectValue placeholder="& SEDIMENT CONTROL PLAN" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sediment">& SEDIMENT CONTROL PLAN</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="rev01">
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Rev. 01 Current" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rev01">Rev. 01 Current</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <FileDown className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Cloud className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
