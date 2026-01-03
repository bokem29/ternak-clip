import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SubmissionCard } from "@/components/dashboard/SubmissionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Submissions = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadSubmissions();
    }, []);

    const loadSubmissions = async () => {
        try {
            setLoading(true);
            const data = await api.get('/submissions');
            // Enforce status standardization and data structure
            const formatted = (data.submissions || []).map((s: any) => ({
                ...s,
                status: (s.status || 'pending').toLowerCase(),
                submittedAt: formatDate(s.submittedAt || s.createdAt),
            }));
            setSubmissions(formatted);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Gagal memuat daftar pengajuan",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const filteredSubmissions = submissions.filter((s) =>
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.campaign?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali ke Dashboard
                </Button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-display font-bold">Semua Pengajuan</h1>
                        <p className="text-sm text-muted-foreground">
                            Daftar semua clip yang telah Anda ajukan
                        </p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari pengajuan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>
            </div>

            <Card variant="glass">
                <CardHeader className="py-4">
                    <CardTitle className="text-base font-display">
                        Riwayat Pengajuan ({filteredSubmissions.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-muted-foreground">
                                Tidak ada pengajuan ditemukan
                            </p>
                        </div>
                    ) : (
                        filteredSubmissions.map((submission) => (
                            <SubmissionCard key={submission.id} {...submission} />
                        ))
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default Submissions;
