import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Users,
  Book,
  ShieldCheck,
  Handshake,
  GraduationCap,
} from "lucide-react";

const HelpItem: React.FC<{
  icon: React.ReactNode;
  text: string;
  href: string;
}> = ({ icon, text, href }) => (
  <Button variant="ghost" className="w-full justify-start h-10 px-2" asChild>
    <a href={href} className="flex items-center space-x-2">
      <span className="text-sm text-muted-foreground">{icon}</span>
      <span className="text-sm font-medium text-foreground">{text}</span>
    </a>
  </Button>
);

const HelpPopover: React.FC = () => {
  return (
    <Card className="w-64 bg-background rounded-md overflow-hidden">
      <CardContent className="p-0">
        <ScrollArea className="h-full">
          <div className="grid gap-1 p-1">
            <HelpItem
              icon={<GraduationCap className="h-4 w-4" />}
              text="Knowledge Center"
              href="#"
            />
            <HelpItem
              icon={<FileText className="h-4 w-4" />}
              text="Release Notes"
              href="#"
            />
            <HelpItem
              icon={<Users className="h-4 w-4" />}
              text="Community Forum"
              href="#"
            />

            <HelpItem
              icon={<Book className="h-4 w-4" />}
              text="User Guide Documentation"
              href="#"
            />

            <Separator className="my-1" />
            <HelpItem
              icon={<Handshake className="h-4 w-4" />}
              text="Terms & Conditions"
              href="#"
            />
            <HelpItem
              icon={<ShieldCheck className="h-4 w-4" />}
              text="Privacy Policy"
              href="#"
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HelpPopover;
