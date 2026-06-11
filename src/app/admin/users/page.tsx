import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserStatusButton } from "./user-status-button";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User management</h1>
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name}</TableCell>
                <TableCell className="text-neutral-500">{p.email}</TableCell>
                <TableCell>
                  <Badge variant={p.role === "therapist" ? "default" : "secondary"} className={p.role === "therapist" ? "bg-emerald-600" : ""}>
                    {p.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={p.status === "active" ? "outline" : "destructive"}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-neutral-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {p.role !== "admin" && (
                    <UserStatusButton profileId={p.id} status={p.status} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
