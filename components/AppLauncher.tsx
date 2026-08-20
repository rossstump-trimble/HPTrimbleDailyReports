"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

const AppButton: React.FC<{
  name: string;
  description: string;
  image: string;
  href?: string;
}> = ({ name, description, image, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
    <Button variant="ghost" className="w-full justify-start h-16 px-4">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0">
          <Image src={image} alt={name} width={48} height={48} />
        </div>
        <div className="text-left">
          <h3 className="text-sm font-semibold text-foreground ">{name}</h3>
          <p className="text-xs text-muted-foreground font-mono">
            {description}
          </p>
        </div>
      </div>
    </Button>
  </a>
);

const AppLauncher: React.FC = () => {
  return (
    <ScrollArea className="h-[400px]">
      <div className="grid gap-1 p-1">
        <AppButton
          name="CDE Search"
          description="Search accross all Trimble products"
          image="/logos/cde-search.svg"
          href="/cde-search"
        />
        <AppButton
          name="Trimble Connect"
          description="BIM Collaboration"
          image="/logos/connect-light.svg"
          href="/"
        />
        <AppButton
          name="Trimble Assistant Studio"
          description="AI-powered Assistant"
          image="/logos/assistant.svg"
          href="https://main.d1x1crzo2nxp8b.amplifyapp.com/studio"
        />

        <AppButton
          name="Analytics"
          description="Business Insights"
          image="/logos/analytics.svg"
        />
        <AppButton
          name="App Xchange"
          description="Data Integration"
          image="/logos/xchange-light.svg"
          href="https://app-test.xchange.trimble.com/accounts/364/workspaces"
        />
        <AppButton
          name="Trimble Admin Console"
          description="User & Policy Management"
          image="/logos/admin.svg"
          href="https://stage.accounts.trimble.com"
        />
        <AppButton
          name="Marketplace"
          description="Extensions & Apps"
          image="/logos/marketplace-new.svg"
          href="https://main.dshx23bsis7hy.amplifyapp.com/"
        />
        <AppButton
          name="Developer Portal"
          description="Application & API Management"
          image="/logos/developer-portal.svg"
          href="https://main.dshx23bsis7hy.amplifyapp.com/developers"
        />
        <Separator className="my-1" />
        <AppButton
          name="Numark"
          description="Geospatial Data"
          image="/logos/numark1.svg"
          href="https://web.dev.numark.fieldsystems.trimble.com/"
        />
        <AppButton
          name="SketchUp"
          description="Design Collaboration"
          image="/logos/sketchup.svg"
          href="https://app.sketchup.com/app"
        />
        <AppButton
          name="ProjectSight"
          description="Construction Project Management"
          image="/logos/projectsight.svg"
          href="/projectsight"
        />
        <AppButton
          name="WorksManager"
          description="Civil Project Management"
          image="/logos/wm.svg"
          href="https://worksmanager.com/"
        />
        <Separator className="my-1" />
        <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
          Explore More Applications
        </div>
        <AppButton
          name="Tekla Structures"
          description="Building Information Modeling"
          image="/logos/tekla.svg"
          href="https://www.tekla.com/uk/products/tekla-structures"
        />
        <AppButton
          name="Estimation MEP"
          description="Mechanical, Electrical, Plumbing"
          image="/logos/mep.svg"
          href="https://mep.trimble.com/en/products/estimationMEP"
        />
        <AppButton
          name="Connect2Fab"
          description="Fabrication"
          image="/logos/connect2fab.svg"
        />
        <AppButton
          name="Viewpoint"
          description="Construction ERP"
          image="/logos/viewpoint.svg"
          href="https://www.viewpoint.com/en-gb/"
        />
      </div>
      <a
        href="https://trimble.com"
        className="block text-sm text-primary hover:underline p-4"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trimble Inc.
      </a>
    </ScrollArea>
  );
};

export default AppLauncher;
