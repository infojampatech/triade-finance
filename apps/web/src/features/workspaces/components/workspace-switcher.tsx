import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  workspaceTypeIcons,
  workspaceTypeLabels,
} from "../workspaces.presentation";
import { workspacesQueryOptions } from "../workspaces.queries";

export function WorkspaceSwitcher() {
  const { data: workspaces, isLoading } = useQuery(workspacesQueryOptions());
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  if (isLoading || !workspaces || workspaces.length === 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
        <span>👤</span>
        <span className="font-medium">Pessoal</span>
      </div>
    );
  }

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-8 items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 text-xs font-medium shadow-none hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="text-sm">
          {workspaceTypeIcons[currentWorkspace.type] || "📁"}
        </span>
        <span className="hidden sm:inline font-semibold">
          {currentWorkspace.name}
        </span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Pilares da Tríade
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => {
          const isSelected = ws.id === currentWorkspace.id;
          return (
            <DropdownMenuItem
              className="flex cursor-pointer items-center justify-between text-xs py-2"
              key={ws.id}
              onClick={() => setActiveWorkspaceId(ws.id)}
            >
              <div className="flex items-center gap-2">
                <span>{workspaceTypeIcons[ws.type] || "📁"}</span>
                <div>
                  <div className="font-medium">{ws.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {workspaceTypeLabels[ws.type]}
                  </div>
                </div>
              </div>
              {isSelected && <Check className="size-3.5 text-brand-strong" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
