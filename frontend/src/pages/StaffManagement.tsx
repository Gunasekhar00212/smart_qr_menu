import { useMemo, useState, useEffect } from 'react';
import { Users, Edit, Eye, Trash, Plus, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/apiClient';

const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

type Staff = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
};

export default function StaffManagement() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Server',
    phone: '',
    password: ''
  });

  const stats = useMemo(() => ({
    total: staff.length,
    roles: new Set(staff.map((s) => s.role)).size,
  }), [staff]);

  // Fetch staff members
  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/staff?restaurantId=${RESTAURANT_ID}`));
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      } else {
        throw new Error('Failed to fetch staff');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDetails = (s: Staff) => {
    setSelected(s);
    setOpenDrawer(true);
  };

  const openEditDialog = (s: Staff) => {
    setSelected(s);
    setFormData({
      name: s.name,
      email: s.email,
      role: s.role,
      phone: s.phone || '',
      password: ''
    });
    setOpenEdit(true);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(getApiUrl('/api/staff'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          restaurantId: RESTAURANT_ID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add staff member');
      }

      toast({
        title: '✅ Staff Member Added',
        description: `${formData.name} has been added successfully${data.defaultPassword ? `. Default password: ${data.defaultPassword}` : ''}`,
      });

      setOpenAdd(false);
      setFormData({ name: '', email: '', role: 'Server', phone: '', password: '' });
      fetchStaff();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add staff member',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setIsSaving(true);

    try {
      const response = await fetch(getApiUrl(`/api/staff/${selected.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update staff member');
      }

      toast({
        title: '✅ Staff Member Updated',
        description: `${formData.name} has been updated successfully`,
      });

      setOpenEdit(false);
      fetchStaff();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff member',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(getApiUrl(`/api/staff/${id}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete staff member');
      }

      toast({
        title: '✅ Staff Member Deleted',
        description: 'The staff member has been removed',
      });

      if (selected?.id === id) {
        setOpenDrawer(false);
      }
      
      fetchStaff();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete staff member',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Staff Management</h1>
            <p className="text-muted-foreground">Manage staff roles and permissions</p>
          </div>

          <Button onClick={() => { 
            setFormData({ name: '', email: '', role: 'Server', phone: '', password: '' });
            setOpenAdd(true);
          }} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Roles</p>
                  <p className="text-2xl font-bold">{stats.roles}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">R</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="text-sm text-muted-foreground">{staff.length} members</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No staff members yet. Click "Add Staff Member" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id} onClick={() => openDetails(s)} className="cursor-pointer">
                      <TableCell>
                        <Avatar>
                          <AvatarFallback>{s.name.split(' ').map((n) => n[0]).slice(0,2).join('')}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetails(s); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditDialog(s); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteStaff(s.id); }}>
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Drawer for details */}
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Staff Details</DrawerTitle>
              <DrawerDescription>View staff member profile and information</DrawerDescription>
            </DrawerHeader>

            <div className="p-4">
              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="text-lg">{selected.name.split(' ').map((n) => n[0]).slice(0,2).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-semibold">{selected.name}</div>
                      <Badge variant="outline">{selected.role}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selected.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selected.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{new Date(selected.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No staff selected.</div>
              )}
            </div>

            <DrawerFooter>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="w-full" onClick={() => setOpenDrawer(false)}>Close</Button>
                {selected && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleDeleteStaff(selected.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Add Staff Dialog */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>Add a new team member to your restaurant</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addName">Full Name *</Label>
                <Input
                  id="addName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addEmail">Email *</Label>
                <Input
                  id="addEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addRole">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Chef">Chef</SelectItem>
                    <SelectItem value="Server">Server</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Kitchen Staff">Kitchen Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addPhone">Phone</Label>
                <Input
                  id="addPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addPassword">Password (optional)</Label>
                <Input
                  id="addPassword"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank for default password"
                />
                <p className="text-xs text-muted-foreground">If left blank, password will be "Welcome123"</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Adding...' : 'Add Member'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Dialog */}
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>Update staff member information</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Full Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRole">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Chef">Chef</SelectItem>
                    <SelectItem value="Server">Server</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Kitchen Staff">Kitchen Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{stats.activeToday}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Roles</p>
                  <p className="text-2xl font-bold">{stats.roles}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">R</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Shift Hours</p>
                  <p className="text-2xl font-bold">{stats.avgShift}h</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">⏱️</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main table */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="text-sm text-muted-foreground">{staff.length} members</div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Profile</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id} onClick={() => openDetails(s)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{s.name.split(' ').map((n) => n[0]).slice(0,2).join('')}</AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === 'active' && <Badge variant="success">Active</Badge>}
                      {s.status === 'on shift' && <Badge variant="warning">On Shift</Badge>}
                      {s.status === 'offline' && <Badge variant="outline">Offline</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{s.email}<div className="text-xs">{s.phone}</div></div>
                    </TableCell>
                    <TableCell>{s.lastActive}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetails(s); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* open edit */ }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); removeStaff(s.id); }}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Drawer for details */}
        <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Staff Details</DrawerTitle>
              <DrawerDescription>Profile, contact, role and shift history.</DrawerDescription>
            </DrawerHeader>

            <div className="p-4">
              {selected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>{selected.name.split(' ').map((n) => n[0]).slice(0,2).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-lg font-semibold">{selected.name}</div>
                      <div className="text-sm text-muted-foreground">{selected.role}</div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selected.email}<br />{selected.phone}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Last Active</p>
                    <p className="font-medium">{selected.lastActive}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Shift History</p>
                    <div className="bg-muted p-3 rounded-md text-sm">No historical data available in demo.</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No staff selected.</div>
              )}
            </div>

            <DrawerFooter>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="w-full" onClick={() => setOpenDrawer(false)}>Close</Button>
                <Button variant="destructive" className="w-full">Deactivate</Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Add Staff Dialog */}
        <Dialog>
          <DialogContent open={openAdd} onOpenChange={setOpenAdd}>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>Invite a team member and configure role & permissions.</DialogDescription>
            </DialogHeader>

            <form onSubmit={addDummyStaff} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input name="name" className="w-full mt-1 p-3 rounded-md border" required />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select name="role" className="w-full mt-1 p-3 rounded-md border">
                  <option>Server</option>
                  <option>Chef</option>
                  <option>Manager</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input name="email" type="email" className="w-full mt-1 p-3 rounded-md border" required />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="flex-1">Add Member</Button>
                <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
