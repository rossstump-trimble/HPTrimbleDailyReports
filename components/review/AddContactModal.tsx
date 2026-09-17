"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserPlus, Loader2, Send } from "lucide-react";
import type { DailyReport, ProjectCompany, CompanyContact } from "@/types/hpproto";

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  report: DailyReport | null;
  company: ProjectCompany | null;
  onContactCreatedAndApproved: (contact: CompanyContact) => Promise<void>;
}

export function AddContactModal({
  open,
  onOpenChange,
  projectId,
  report,
  company,
  onContactCreatedAndApproved,
}: AddContactModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Foreman");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (report) {
      const rawName = (report.submittedBy || "").trim();
      const parts = rawName.split(/\s+/);
      if (parts.length > 1) {
        setFirstName(parts[0]);
        setLastName(parts.slice(1).join(" "));
      } else if (parts.length === 1 && parts[0]) {
        setFirstName(parts[0]);
        setLastName("Foreman");
      } else {
        setFirstName("");
        setLastName("");
      }

      const initialEmail = report.emailRecipients?.[0] || "";
      setEmail(initialEmail);
      setTitle("Foreman");
      setPhone("");
      setError(null);
    }
  }, [report]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !company) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and Last name are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create contact via API
      const res = await fetch(`/api/projects/${projectId}/companies/${company.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          title: title.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create contact");
      }

      const createdContact = json.contact as CompanyContact;

      // 2. Trigger approval and dispatch
      await onContactCreatedAndApproved(createdContact);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to add contact and send report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <UserPlus className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Contact Verification Required
              </span>
            </div>
            <DialogTitle className="text-lg">
              Add {report?.submittedBy || "Foreman"} to {company?.name || "Company"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              ProjectSight requires a registered company contact before this Daily Report can be synced.
              Add this person to the company directory to proceed.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid gap-3 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modalFirstName" className="text-xs">
                  First Name *
                </Label>
                <Input
                  id="modalFirstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="modalLastName" className="text-xs">
                  Last Name *
                </Label>
                <Input
                  id="modalLastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modalEmail" className="text-xs">
                Email Address
              </Label>
              <Input
                id="modalEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="foreman@trade.com"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modalTitle" className="text-xs">
                  Title / Role
                </Label>
                <Input
                  id="modalTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Foreman"
                  className="mt-1 h-9 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="modalPhone" className="text-xs">
                  Phone Number
                </Label>
                <Input
                  id="modalPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-tc-blue hover:bg-blue-700 text-white gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adding &amp; Sending…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Add Contact &amp; Send to PS
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
