import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Settings, HardHat, RefreshCw, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const UserProfilePopover = () => {
  return (
    <div className="w-96 bg-background rounded-md overflow-hidden">
      {" "}
      <div className="flex flex-col items-center gap-2 p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="/avatars/01.png" alt="User Avatar" />
          <AvatarFallback>SG</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-sm font-semibold">
            Shankaralingam Gomathinayagam
          </h2>
          <p className="text-xs text-muted-foreground">
            shankaralingam_gomathinayagam@example.com
          </p>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <HardHat className="mr-2 h-4 w-4" />
            My Products
          </Button>
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Admin Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <RefreshCw className="mr-2 h-4 w-4" />
            Check for updated license
          </Button>
          <Separator className="my-2" />
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4">
        <Button variant="default" className="w-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </CardFooter>
    </div>
  );
};

export default UserProfilePopover;
