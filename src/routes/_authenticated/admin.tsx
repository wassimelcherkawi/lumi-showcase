import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin,
  listAllVideos,
  listRegistrations,
  createVideo,
  updateVideo,
  deleteVideo,
  deleteRegistration,
  getGoogleSheetId,
  setGoogleSheetId,
} from "@/lib/admin.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Download, Home, LogOut, Trash2, Upload, Video as VideoIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(checkIsAdmin);
  const { data: adminCheck, isLoading: checkingAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => checkAdmin(),
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (checkingAdmin) {
    return (
      <div dir="rtl" className="min-h-screen p-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-8">
        <Card className="p-8 max-w-md text-center space-y-4 glass">
          <h1 className="text-2xl font-bold">غير مصرح</h1>
          <p className="text-muted-foreground">
            ليس لديك صلاحيات الوصول إلى لوحة التحكم.
          </p>
          <Button onClick={() => navigate({ to: "/" })}>العودة للرئيسية</Button>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border/40 backdrop-blur-xl sticky top-0 z-10 bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            لوحة التحكم
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="ms-2 h-4 w-4" />
                الرئيسية
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="ms-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="videos" dir="rtl">
          <TabsList className="mb-6">
            <TabsTrigger value="videos">الفيديوهات</TabsTrigger>
            <TabsTrigger value="registrations">التسجيلات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <VideosTab />
          </TabsContent>
          <TabsContent value="registrations">
            <RegistrationsTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function VideosTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllVideos);
  const createFn = useServerFn(createVideo);
  const updateFn = useServerFn(updateVideo);
  const deleteFn = useServerFn(deleteVideo);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => listFn(),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast.error("يرجى إدخال العنوان واختيار الملف");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      await createFn({
        data: {
          title: title.trim(),
          description: description.trim() || null,
          storagePath: path,
          isPublished: true,
        },
      });
      toast.success("تمت إضافة الفيديو بنجاح");
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = useMutation({
    mutationFn: (v: { id: string; isPublished: boolean }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "فشل الحذف"),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 glass space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Upload className="h-5 w-5" />
          إضافة فيديو جديد
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الفيديو"
            />
          </div>
          <div className="space-y-2">
            <Label>ملف الفيديو</Label>
            <Input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>الوصف</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر"
            rows={3}
          />
        </div>
        <Button onClick={handleUpload} disabled={uploading} className="w-full md:w-auto">
          {uploading ? "جاري الرفع..." : "رفع الفيديو"}
        </Button>
      </Card>

      <Card className="p-6 glass">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <VideoIcon className="h-5 w-5" />
          قائمة الفيديوهات ({videos?.length ?? 0})
        </h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !videos || videos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">لا توجد فيديوهات بعد</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={v.is_published}
                        onCheckedChange={(checked) =>
                          togglePublish.mutate({ id: v.id, isPublished: checked })
                        }
                      />
                      <Badge variant={v.is_published ? "default" : "secondary"}>
                        {v.is_published ? "منشور" : "مخفي"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(v.created_at).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`حذف "${v.title}"؟`)) remove.mutate(v.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function RegistrationsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listRegistrations);
  const deleteFn = useServerFn(deleteRegistration);

  const { data: regs, isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => listFn(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-registrations"] });
    },
  });

  const exportCsv = () => {
    if (!regs || regs.length === 0) {
      toast.error("لا توجد تسجيلات للتصدير");
      return;
    }
    const headers = ["الاسم الأول", "الاسم الأخير", "البريد", "الهاتف", "الفيديو", "التاريخ"];
    const escape = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const rows = regs.map((r) =>
      [
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.video_title,
        new Date(r.created_at).toLocaleString("ar-EG"),
      ]
        .map(escape)
        .join(","),
    );
    const csv = "\uFEFF" + [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${regs.length} تسجيل`);
  };

  return (
    <Card className="p-6 glass">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">التسجيلات ({regs?.length ?? 0})</h2>
        <Button onClick={exportCsv} disabled={!regs || regs.length === 0}>
          <Download className="ms-2 h-4 w-4" />
          تصدير CSV
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !regs || regs.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">لا توجد تسجيلات بعد</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">البريد</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">الفيديو</TableHead>
                <TableHead className="text-right">المزامنة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.first_name} {r.last_name}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">{r.email}</TableCell>
                  <TableCell dir="ltr" className="text-right">{r.phone}</TableCell>
                  <TableCell>{r.video_title}</TableCell>
                  <TableCell>
                    <Badge variant={r.synced_to_sheets ? "default" : "secondary"}>
                      {r.synced_to_sheets ? "تمت" : "معلقة"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(r.created_at).toLocaleDateString("ar-EG")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("حذف هذا التسجيل؟")) remove.mutate(r.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const getFn = useServerFn(getGoogleSheetId);
  const setFn = useServerFn(setGoogleSheetId);

  const { data, isLoading } = useQuery({
    queryKey: ["sheet-id"],
    queryFn: () => getFn(),
  });

  const [sheetId, setSheetId] = useState("");
  const initialized = useRef(false);
  if (data && !initialized.current) {
    setSheetId(data.sheetId);
    initialized.current = true;
  }

  const save = useMutation({
    mutationFn: (id: string) => setFn({ data: { sheetId: id } }),
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["sheet-id"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "فشل الحفظ"),
  });

  return (
    <Card className="p-6 glass max-w-2xl space-y-4">
      <h2 className="text-xl font-bold">إعدادات Google Sheets</h2>
      <p className="text-sm text-muted-foreground">
        أدخل معرف جدول Google (Spreadsheet ID) لمزامنة التسجيلات تلقائياً.
        يمكنك إيجاده في رابط الجدول بين <code>/d/</code> و <code>/edit</code>.
      </p>
      <div className="space-y-2">
        <Label>Spreadsheet ID</Label>
        <Input
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          placeholder="1ABCdef..."
          disabled={isLoading}
          dir="ltr"
        />
      </div>
      <Button
        onClick={() => save.mutate(sheetId.trim())}
        disabled={save.isPending || isLoading}
      >
        {save.isPending ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </Card>
  );
}