"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Eye, Settings, Plus, Trash2, RefreshCcw, Users as UsersIcon } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
  role: "ADMIN" | "USER"
  createdAt?: string
  updatedAt?: string
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER" as "ADMIN" | "USER",
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch("/api/users", { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to load users (${res.status})`)
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e: any) {
      setError(e.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert("Please fill in all required fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email)) {
      alert("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUser.name, email: newUser.email, role: newUser.role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create user")
      setUsers((prev) => [data.user, ...prev])
      setNewUser({ name: "", email: "", role: "USER" })
      setIsDialogOpen(false)
    } catch (e: any) {
      alert(e.message || "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return
    try {
      setLoading(true)
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to delete user")
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (e: any) {
      alert(e.message || "Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (id: string, role: "ADMIN" | "USER") => {
    try {
      setLoading(true)
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update user")
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
    } catch (e: any) {
      alert(e.message || "Failed to update user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading} className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter full name"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email address"
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-muted-foreground">Role</Label>
                  <Select value={newUser.role} onValueChange={(value: "ADMIN" | "USER") => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddUser} disabled={loading}>Add User</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-600">
                    {(user.name || user.email)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg text-card-foreground">{user.name || "Unnamed"}</CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Badge
                  variant="outline"
                  className={
                    user.role === "ADMIN"
                      ? "text-red-400 border-red-400"
                      : "text-blue-400 border-blue-400"
                  }
                >
                  {user.role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                  {user.role === "USER" && <Eye className="h-3 w-3 mr-1" />}
                  {user.role}
                </Badge>
              </div>
              <div className="flex gap-2">
                {user.role === "ADMIN" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRoleChange(user.id, "USER")}
                    disabled={loading}
                  >
                    Demote to User
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleRoleChange(user.id, "ADMIN")}
                    disabled={loading}
                  >
                    Promote to Admin
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
