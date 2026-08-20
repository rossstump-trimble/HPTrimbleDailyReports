"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageSquare,
  Phone,
  Globe,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Contact channel cards
// ---------------------------------------------------------------------------
const CONTACT_CHANNELS = [
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Support Center",
    description: "Browse the full knowledge base and submit a ticket.",
    action: "Visit Support Center",
    href: "https://support.trimble.com/hc/en-us",
    badge: "Recommended",
    badgeClass:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    icon: <Phone className="h-5 w-5" />,
    title: "Phone Support",
    description: "US & Canada: 1-800-606-0404 (Mon–Fri, 7am–8pm CT)",
    action: null,
    href: null,
    badge: null,
    badgeClass: null,
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Email Support",
    description: "projectsight.support@trimble.com",
    action: "Send Email",
    href: "mailto:projectsight.support@trimble.com",
    badge: null,
    badgeClass: null,
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Live Chat",
    description:
      "Available Mon–Fri, 8am–6pm ET. Start a conversation from the Support Center.",
    action: "Start Chat",
    href: "https://support.trimble.com/hc/en-us",
    badge: null,
    badgeClass: null,
  },
];

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------
const CATEGORIES = [
  "Account & Billing",
  "Feature Request",
  "Bug / Technical Issue",
  "Data / Imports",
  "Integrations",
  "User Permissions",
  "Performance",
  "Other",
];

interface FormState {
  name: string;
  email: string;
  company: string;
  category: string;
  subject: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  company: "",
  category: "",
  subject: "",
  description: "",
};

const ContactForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulated submission delay — replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
    setSubmitted(true);
    toast({
      title: "Support request submitted",
      description: "We'll get back to you within one business day.",
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold">Request submitted!</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your support request has been received. A member of our team will
          respond to{" "}
          <span className="font-medium text-foreground">{form.email}</span>{" "}
          within one business day.
        </p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => {
            setForm(EMPTY_FORM);
            setSubmitted(false);
          }}
        >
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="company">Company / Organization</Label>
        <Input
          id="company"
          name="company"
          placeholder="Acme Construction"
          value={form.company}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          value={form.category}
          onValueChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
          required
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="Brief description of your issue"
          value={form.subject}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Please provide as much detail as possible, including steps to reproduce if applicable."
          rows={5}
          value={form.description}
          onChange={handleChange}
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Submitting…" : "Submit Request"}
      </Button>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ContactSupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contact Support</h1>
        <p className="text-muted-foreground mt-1">
          Get help from the ProjectSight support team or browse self-service resources.
        </p>
      </div>

      {/* Contact channels */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONTACT_CHANNELS.map((ch) => (
            <Card key={ch.title} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{ch.icon}</span>
                    <CardTitle className="text-base">{ch.title}</CardTitle>
                  </div>
                  {ch.badge && (
                    <Badge
                      variant="outline"
                      className={ch.badgeClass ?? undefined}
                    >
                      {ch.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {ch.description}
                </CardDescription>
              </CardHeader>
              {ch.action && ch.href && (
                <CardContent className="pt-0">
                  <a
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    {ch.action}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Support request form */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Submit a Support Request</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Fill out the form below and our team will respond within one business day.
        </p>
        <ContactForm />
      </section>
    </div>
  );
}
