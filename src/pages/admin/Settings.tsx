import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useToast } from "@/hooks/use-toast";
import {
    Settings as SettingsIcon,
    DollarSign,
    Shield,
    Zap,
    Save,
    RefreshCw,
} from "lucide-react";

const Settings = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("platform");
    const [saving, setSaving] = useState(false);

    // Platform Settings
    const [platformSettings, setPlatformSettings] = useState({
        defaultCPM: "50000",
        minPayoutThreshold: "100000",
        autoApprovalYouTube: true,
        fraudThresholdViews: "1000",
        fraudThresholdLikes: "100",
    });

    // Payment Settings
    const [paymentSettings, setPaymentSettings] = useState({
        escrowAccountNumber: "1234567890",
        escrowBank: "BCA",
        withdrawMethods: ["BANK", "DANA", "GOPAY", "OVO"],
        feePercentage: "2.5",
    });

    // Security Settings
    const [securitySettings, setSecuritySettings] = useState({
        allowedIPs: "127.0.0.1, 192.168.1.1",
        sessionTimeout: "3600",
        maxLoginAttempts: "5",
        requireMFA: false,
    });

    // Integration Settings
    const [integrationSettings, setIntegrationSettings] = useState({
        youtubeApiKey: "AIzaSy...",
        tiktokApiKey: "tk_...",
        metaApiKey: "EAA...",
        webhookUrl: "https://api.example.com/webhook",
        webhookSecret: "whsec_...",
    });

    const handleSave = async (section: string) => {
        setSaving(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast({
            title: "Settings Saved",
            description: `${section} settings have been updated successfully.`,
        });

        setSaving(false);
    };

    const tabs = [
        { id: "platform", label: "Platform", icon: SettingsIcon },
        { id: "payment", label: "Payment", icon: DollarSign },
        { id: "security", label: "Security", icon: Shield },
        { id: "integration", label: "Integration", icon: Zap },
    ];

    return (
        <AdminLayout>
            <AdminHeader title="System Settings" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {/* Tabs */}
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl mb-6 overflow-hidden">
                    <div className="flex border-b border-white/10">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-all ${activeTab === tab.id
                                            ? "bg-blue-500/10 border-b-2 border-blue-500 text-blue-400"
                                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Platform Settings */}
                {activeTab === "platform" && (
                    <div className="glass-panel-v2 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Platform Settings</h2>
                                <p className="text-zinc-500 text-sm">Global platform configuration and rules</p>
                            </div>
                            <button
                                onClick={() => handleSave("Platform")}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Default CPM */}
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Default CPM (IDR)</label>
                                    <input
                                        type="number"
                                        value={platformSettings.defaultCPM}
                                        onChange={(e) =>
                                            setPlatformSettings({ ...platformSettings, defaultCPM: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Default CPM for new campaigns</p>
                                </div>

                                {/* Min Payout Threshold */}
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Min Payout Threshold (IDR)</label>
                                    <input
                                        type="number"
                                        value={platformSettings.minPayoutThreshold}
                                        onChange={(e) =>
                                            setPlatformSettings({ ...platformSettings, minPayoutThreshold: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Minimum amount for withdrawal requests</p>
                                </div>

                                {/* Auto-approval */}
                                <div className="col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={platformSettings.autoApprovalYouTube}
                                            onChange={(e) =>
                                                setPlatformSettings({ ...platformSettings, autoApprovalYouTube: e.target.checked })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-white text-sm font-medium">Auto-approve YouTube submissions</span>
                                            <p className="text-zinc-600 text-xs">Automatically approve submissions from verified YouTube channels</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Fraud Thresholds */}
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Fraud Threshold - Views</label>
                                    <input
                                        type="number"
                                        value={platformSettings.fraudThresholdViews}
                                        onChange={(e) =>
                                            setPlatformSettings({ ...platformSettings, fraudThresholdViews: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Flag submissions with views above this threshold</p>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Fraud Threshold - Likes</label>
                                    <input
                                        type="number"
                                        value={platformSettings.fraudThresholdLikes}
                                        onChange={(e) =>
                                            setPlatformSettings({ ...platformSettings, fraudThresholdLikes: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Flag suspicious like ratios</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Settings */}
                {activeTab === "payment" && (
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Payment Settings</h2>
                                <p className="text-zinc-500 text-sm">Escrow account and withdrawal configuration</p>
                            </div>
                            <button
                                onClick={() => handleSave("Payment")}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Escrow Bank</label>
                                    <input
                                        type="text"
                                        value={paymentSettings.escrowBank}
                                        onChange={(e) =>
                                            setPaymentSettings({ ...paymentSettings, escrowBank: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Escrow Account Number</label>
                                    <input
                                        type="text"
                                        value={paymentSettings.escrowAccountNumber}
                                        onChange={(e) =>
                                            setPaymentSettings({ ...paymentSettings, escrowAccountNumber: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Fee Percentage (%)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={paymentSettings.feePercentage}
                                        onChange={(e) =>
                                            setPaymentSettings({ ...paymentSettings, feePercentage: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Platform fee on transactions</p>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Withdrawal Methods</label>
                                    <div className="space-y-2">
                                        {["BANK", "DANA", "GOPAY", "OVO"].map((method) => (
                                            <label key={method} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={paymentSettings.withdrawMethods.includes(method)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setPaymentSettings({
                                                                ...paymentSettings,
                                                                withdrawMethods: [...paymentSettings.withdrawMethods, method],
                                                            });
                                                        } else {
                                                            setPaymentSettings({
                                                                ...paymentSettings,
                                                                withdrawMethods: paymentSettings.withdrawMethods.filter((m) => m !== method),
                                                            });
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-white text-sm">{method}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Settings */}
                {activeTab === "security" && (
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Security Settings</h2>
                                <p className="text-zinc-500 text-sm">Access control and security policies</p>
                            </div>
                            <button
                                onClick={() => handleSave("Security")}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-zinc-400 text-sm block mb-2">IP Whitelist (Admin Access)</label>
                                    <textarea
                                        value={securitySettings.allowedIPs}
                                        onChange={(e) =>
                                            setSecuritySettings({ ...securitySettings, allowedIPs: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 min-h-[100px]"
                                        placeholder="127.0.0.1, 192.168.1.1"
                                    />
                                    <p className="text-zinc-600 text-xs mt-1">Comma-separated IP addresses allowed for admin access</p>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Session Timeout (seconds)</label>
                                    <input
                                        type="number"
                                        value={securitySettings.sessionTimeout}
                                        onChange={(e) =>
                                            setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Max Login Attempts</label>
                                    <input
                                        type="number"
                                        value={securitySettings.maxLoginAttempts}
                                        onChange={(e) =>
                                            setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={securitySettings.requireMFA}
                                            onChange={(e) =>
                                                setSecuritySettings({ ...securitySettings, requireMFA: e.target.checked })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-white text-sm font-medium">Require Multi-Factor Authentication</span>
                                            <p className="text-zinc-600 text-xs">Enforce MFA for all admin accounts</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Integration Settings */}
                {activeTab === "integration" && (
                    <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-white font-semibold text-lg">Integration Settings</h2>
                                <p className="text-zinc-500 text-sm">API keys and webhook configuration</p>
                            </div>
                            <button
                                onClick={() => handleSave("Integration")}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">YouTube API Key</label>
                                    <input
                                        type="password"
                                        value={integrationSettings.youtubeApiKey}
                                        onChange={(e) =>
                                            setIntegrationSettings({ ...integrationSettings, youtubeApiKey: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">TikTok API Key</label>
                                    <input
                                        type="password"
                                        value={integrationSettings.tiktokApiKey}
                                        onChange={(e) =>
                                            setIntegrationSettings({ ...integrationSettings, tiktokApiKey: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2">Meta (Facebook/Instagram) API Key</label>
                                    <input
                                        type="password"
                                        value={integrationSettings.metaApiKey}
                                        onChange={(e) =>
                                            setIntegrationSettings({ ...integrationSettings, metaApiKey: e.target.value })
                                        }
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                                    />
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <h3 className="text-white font-medium mb-4">Webhook Configuration</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-zinc-400 text-sm block mb-2">Webhook URL</label>
                                            <input
                                                type="url"
                                                value={integrationSettings.webhookUrl}
                                                onChange={(e) =>
                                                    setIntegrationSettings({ ...integrationSettings, webhookUrl: e.target.value })
                                                }
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                                                placeholder="https://api.example.com/webhook"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-zinc-400 text-sm block mb-2">Webhook Secret</label>
                                            <input
                                                type="password"
                                                value={integrationSettings.webhookSecret}
                                                onChange={(e) =>
                                                    setIntegrationSettings({ ...integrationSettings, webhookSecret: e.target.value })
                                                }
                                                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                                                placeholder="whsec_..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Settings;
