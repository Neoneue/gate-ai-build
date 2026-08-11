import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Monogram } from "@/components/ui/monogram";
import { PageTitle } from "@/components/ui/page-title";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/ui/table-empty-state";
import { TablePaginationFooter } from "@/components/ui/table-pagination-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsCount } from "@/components/ui/tabs-count";
import { Timestamp } from "@/components/ui/timestamp";
import { DashboardChrome } from "@/layouts/DashboardChrome";

const OWNER = {
  name: "Chad Ponticas",
  email: "chad@constellationnetwork.io",
  joined: new Date(2026, 3, 20),
};

export function TeamDefault() {
  const navigate = useNavigate();
  const { sidebarExpanded, toggleSidebar } = useOutletContext<{
    sidebarExpanded: boolean;
    toggleSidebar: () => void;
  }>();
  const [tab, setTab] = useState<"members" | "invitations">("members");

  return (
    <DashboardChrome
      activeNavId="team"
      onNavigate={(path: string) => navigate(path)}
      onToggleSidebar={toggleSidebar}
      sidebarExpanded={sidebarExpanded}
    >
      {/* Content stays fluid, then caps so the cards don't stretch across
          ultrawide displays. CONTAINER query, not viewport: the Ask AI
          panel narrows this column without narrowing the window. `@5xl`
          (1024px inline-size) is the same number as the `max-w-5xl` cap, so
          the class is a no-op until the column is wide enough to bind. */}
      <div className="flex w-full @5xl:max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex @4xl:max-w-1/2 max-w-full flex-col gap-2">
            <PageTitle>Team</PageTitle>
            <p className="type-copy-16 m-0 text-pretty text-muted-foreground tracking-snug">
              Manage roles, invite teammates, and remove access from Chad
              Ponticas&rsquo;s workspace.
            </p>
          </div>
          <Button size="default" variant="default">
            <UserPlus aria-hidden data-icon="inline-start" />
            Invite member
          </Button>
        </div>

        <Tabs
          className="gap-4"
          onValueChange={(v) => setTab(v as typeof tab)}
          value={tab}
        >
          <TabsList className="-mt-2 px-0" variant="line">
            <TabsTrigger value="members">
              <span>Members</span>
              <TabsCount>1</TabsCount>
            </TabsTrigger>
            <TabsTrigger value="invitations">
              <span>Invitations</span>
              <TabsCount>0</TabsCount>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card density="flush">
              <Table className="min-w-[560px] table-fixed">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%] whitespace-nowrap">
                      Member
                    </TableHead>
                    <TableHead className="w-[22%] whitespace-nowrap">
                      Joined
                    </TableHead>
                    <TableHead className="w-[38%] whitespace-nowrap">
                      Role
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex min-w-0 items-center gap-3">
                        <Monogram initials="C" size="md" tone="blue" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="type-label-14 truncate text-foreground">
                            {OWNER.name}
                          </span>
                          <span className="type-copy-12 truncate text-muted-foreground tracking-snug">
                            {OWNER.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="type-mono-14 whitespace-nowrap text-foreground">
                      <Timestamp date={OWNER.joined} format="dateNumeric" />
                    </TableCell>
                    <TableCell className="type-copy-14 whitespace-nowrap text-foreground">
                      Owner
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <TablePaginationFooter
                onPageChange={(_p) => {
                  /* single page, no-op */
                }}
                onRowsPerPageChange={(_r) => {
                  /* single page, no-op */
                }}
                page={1}
                rowsPerPage="10"
                total={1}
              />
            </Card>
          </TabsContent>

          <TabsContent value="invitations">
            <Card density="flush">
              <TableEmptyState
                body="Teammates you invite will appear here."
                icon={
                  <div
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-md bg-muted"
                  >
                    <UserPlus
                      className="size-5 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  </div>
                }
                title="No teammates invited"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardChrome>
  );
}
