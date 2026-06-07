import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createRegistration } from "@/lib/videos.functions";
import { Loader2, CheckCircle2 } from "lucide-react";

export function RegisterModal({
  open, onOpenChange, videoId, videoTitle,
}: { open: boolean; onOpenChange: (v: boolean) => void; videoId: string | null; videoTitle: string }) {
  const fn = useServerFn(createRegistration);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!videoId) throw new Error("لم يتم اختيار فيديو");
      return fn({ data: { ...form, videoId } });
    },
    onSuccess: () => { setDone(true); toast.success("تم التسجيل بنجاح!"); },
    onError: (e: Error) => toast.error(e.message || "فشل التسجيل"),
  });

  function reset() {
    setDone(false);
    setForm({ firstName: "", lastName: "", email: "", phone: "" });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 200); }}>
      <DialogContent className="glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">{done ? "شكراً لتسجيلك!" : "سجل الآن"}</DialogTitle>
          <DialogDescription>
            {done ? `تم استلام تسجيلك على «${videoTitle}» بنجاح.` : `أدخل بياناتك للتسجيل على فيديو: ${videoTitle}`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 animate-fade-up">
            <CheckCircle2 className="h-16 w-16 text-brand-2" />
            <p className="text-muted-foreground text-center">سنتواصل معك قريباً.</p>
            <Button onClick={() => onOpenChange(false)} className="gradient-bg text-white">تم</Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الأول</Label>
                <Input required maxLength={80} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>اسم العائلة</Label>
                <Input required maxLength={80} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" required maxLength={160} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input type="tel" required maxLength={30} pattern="[+\d\s()\-]+" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full gradient-bg text-white glow-shadow h-11 text-base">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال التسجيل"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}