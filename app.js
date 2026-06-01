/* ==========================================
   AdAgent AI - Premium Marketing Intelligence
   ========================================== */

import './index.css';
import { createClient } from '@supabase/supabase-js';

// Safe environment configuration
const ENV = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ""
};

let supabase = null;
if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
    try {
        supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
        console.log("⚡ Supabase integration active! Connected to:", ENV.SUPABASE_URL);
    } catch (e) {
        console.error("❌ Failed to initialize Supabase client:", e);
    }
} else {
    console.log("ℹ️ Running in premium simulation mode. Local state active.");
}

// Global Application State
window.AdState = {
    user: {
        id: null,
        name: "Akshat",
        email: "akshat@adagent.ai",
        isLoggedIn: false
    },
    theme: "light",
    activeTab: "overview",
    campaigns: [],
    chatHistory: [],
    generatedAd: null,
    optimizationApplied: false
};

// Seed Mock Data
const MOCK_CAMPAIGNS = [
    {
        id: 1,
        name: "EcoBottle - Meta Conversion Ad",
        platform: "meta",
        status: "active",
        budget: 1250,
        impressions: 48900,
        clicks: 3410,
        conversions: 184,
        roi: 3.12,
        ctr: 6.97,
        spend: 840,
        dateCreated: "2026-05-15"
    },
    {
        id: 2,
        name: "SaaS Platform - Google Search Lead Gen",
        platform: "google",
        status: "active",
        budget: 2400,
        impressions: 72100,
        clicks: 5890,
        conversions: 312,
        roi: 2.85,
        ctr: 8.16,
        spend: 1450,
        dateCreated: "2026-05-20"
    },
    {
        id: 3,
        name: "Summer Fashion - TikTok Dynamic Catalog",
        platform: "tiktok",
        status: "paused",
        budget: 800,
        impressions: 112000,
        clicks: 2100,
        conversions: 42,
        roi: 1.45,
        ctr: 1.87,
        spend: 520,
        dateCreated: "2026-05-28"
    },
    {
        id: 4,
        name: "Enterprise Cloud - LinkedIn Sponsored Content",
        platform: "linkedin",
        status: "draft",
        budget: 1500,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        roi: 0,
        ctr: 0,
        spend: 0,
        dateCreated: "2026-06-01"
    }
];

const MOCK_CHAT_HISTORY = [
    {
        sender: "bot",
        text: "Hello Akshat! I'm your AdAgent AI Copilot. I've analyzed your current campaigns. Google Search Lead Gen is yielding **2.85x ROI** this week! Would you like me to suggest optimizations?",
        time: "10:00 AM",
        actions: [
            { label: "Optimize Google Ads", command: "optimize google" },
            { label: "Show ROI Report", command: "report roi" }
        ]
    }
];

// Initializer
document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    setupEventListeners();
    
    // Check for existing session
    if (supabase) {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (session && session.user) {
                AdState.user.isLoggedIn = true;
                AdState.user.id = session.user.id;
                AdState.user.email = session.user.email;
                AdState.user.name = session.user.user_metadata?.full_name || session.user.email.split("@")[0];
                
                await fetchCampaigns();
                await fetchChatHistory();
                
                startRealtimeAnalytics();
                navigateTo("overview");
                return;
            }
        } catch (err) {
            console.error("Session restoration error:", err);
        }
    }
    
    renderAll();
});

// Database Fetch Operations
async function fetchCampaigns() {
    if (supabase && AdState.user.isLoggedIn) {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .order('id', { ascending: true });
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                AdState.campaigns = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    platform: c.platform,
                    status: c.status,
                    budget: parseFloat(c.budget),
                    impressions: parseInt(c.impressions),
                    clicks: parseInt(c.clicks),
                    conversions: parseInt(c.conversions),
                    roi: parseFloat(c.roi),
                    ctr: parseFloat(c.ctr),
                    spend: parseFloat(c.spend),
                    dateCreated: c.date_created
                }));
            } else {
                console.log("No campaigns found. Seeding default campaigns...");
                await seedDefaultCampaigns();
            }
        } catch (err) {
            console.error("Failed to fetch campaigns from DB, falling back to mock data:", err);
            AdState.campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
        }
    } else {
        AdState.campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
    }
}

async function seedDefaultCampaigns() {
    if (supabase && AdState.user.id) {
        const campaignsToInsert = MOCK_CAMPAIGNS.map(c => ({
            name: c.name,
            platform: c.platform,
            status: c.status,
            budget: c.budget,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            roi: c.roi,
            ctr: c.ctr,
            spend: c.spend,
            date_created: c.dateCreated,
            user_id: AdState.user.id
        }));
        
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .insert(campaignsToInsert)
                .select();
                
            if (error) throw error;
            
            if (data) {
                AdState.campaigns = data.map(c => ({
                    id: c.id,
                    name: c.name,
                    platform: c.platform,
                    status: c.status,
                    budget: parseFloat(c.budget),
                    impressions: parseInt(c.impressions),
                    clicks: parseInt(c.clicks),
                    conversions: parseInt(c.conversions),
                    roi: parseFloat(c.roi),
                    ctr: parseFloat(c.ctr),
                    spend: parseFloat(c.spend),
                    dateCreated: c.date_created
                }));
            }
        } catch (err) {
            console.error("Failed to seed default campaigns:", err);
            AdState.campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
        }
    }
}

async function fetchChatHistory() {
    if (supabase && AdState.user.isLoggedIn) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                AdState.chatHistory = data.map(m => ({
                    sender: m.sender,
                    text: m.text,
                    time: m.time,
                    actions: m.actions
                }));
            } else {
                AdState.chatHistory = JSON.parse(JSON.stringify(MOCK_CHAT_HISTORY));
                await saveChatMessage("bot", AdState.chatHistory[0].text, AdState.chatHistory[0].actions, AdState.chatHistory[0].time);
            }
        } catch (err) {
            console.error("Failed to fetch chat log, falling back:", err);
            AdState.chatHistory = JSON.parse(JSON.stringify(MOCK_CHAT_HISTORY));
        }
    } else {
        AdState.chatHistory = JSON.parse(JSON.stringify(MOCK_CHAT_HISTORY));
    }
}

async function saveChatMessage(sender, text, actions = null, time = null) {
    const formattedTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (supabase && AdState.user.isLoggedIn) {
        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    sender: sender,
                    text: text,
                    actions: actions,
                    time: formattedTime,
                    user_id: AdState.user.id
                });
            if (error) throw error;
        } catch (err) {
            console.error("Failed to save chat message:", err);
        }
    }
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem("adagent-theme") || "light";
    setTheme(savedTheme);
}

function setTheme(theme) {
    AdState.theme = theme;
    const html = document.documentElement;
    if (theme === "dark") {
        html.classList.add("dark");
        html.classList.remove("light");
    } else {
        html.classList.add("light");
        html.classList.remove("dark");
    }
    localStorage.setItem("adagent-theme", theme);
    updateThemeToggles();
}

function updateThemeToggles() {
    const icons = document.querySelectorAll(".theme-toggle-icon");
    icons.forEach(icon => {
        if (AdState.theme === "dark") {
            icon.textContent = "light_mode";
        } else {
            icon.textContent = "dark_mode";
        }
    });
}

// Router Controller
function navigateTo(tabName) {
    if (!AdState.user.isLoggedIn && tabName !== "login" && tabName !== "signup") {
        navigateTo("login");
        return;
    }
    
    AdState.activeTab = tabName;
    
    // Update user profile details
    if (AdState.user.isLoggedIn) {
        const nameSpan = document.getElementById("user-name-span");
        const avatarDiv = document.getElementById("user-avatar");
        if (nameSpan) nameSpan.textContent = AdState.user.name;
        if (avatarDiv) avatarDiv.textContent = AdState.user.name.charAt(0).toUpperCase();
    }
    
    // Manage view tabs
    const authView = document.getElementById("auth-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    if (tabName === "login" || tabName === "signup") {
        authView.classList.remove("hidden");
        dashboardView.classList.add("hidden");
        renderAuthViews(tabName);
    } else {
        authView.classList.add("hidden");
        dashboardView.classList.remove("hidden");
        
        // Update sidebar links
        const links = document.querySelectorAll(".sidebar-link");
        links.forEach(link => {
            if (link.getAttribute("data-tab") === tabName) {
                link.classList.add("active", "bg-primary/10", "text-primary");
                link.classList.remove("text-slate-500", "dark:text-slate-400");
            } else {
                link.classList.remove("active", "bg-primary/10", "text-primary");
                link.classList.add("text-slate-500", "dark:text-slate-400");
            }
        });
        
        // Toggle tab panels
        const panels = document.querySelectorAll(".tab-panel");
        panels.forEach(panel => {
            if (panel.id === `${tabName}-panel`) {
                panel.classList.remove("hidden");
                panel.classList.add("fade-in");
            } else {
                panel.classList.add("hidden");
                panel.classList.remove("fade-in");
            }
        });
        
        renderPanelContent(tabName);
    }
}

// Global modal handlers
window.toggleCampaignGeneratorModal = function(show) {
    const modal = document.getElementById("campaign-creator-modal");
    if (!modal) return;
    
    if (show) {
        modal.classList.remove("hidden");
        setTimeout(() => {
            modal.classList.remove("opacity-0");
            modal.querySelector(".max-w-4xl").classList.add("scale-100");
        }, 50);
        renderGeneratorView();
    } else {
        modal.classList.add("opacity-0");
        modal.querySelector(".max-w-4xl").classList.remove("scale-100");
        setTimeout(() => {
            modal.classList.add("hidden");
        }, 300);
    }
};

// Render controllers
function renderAll() {
    if (!AdState.user.isLoggedIn) {
        navigateTo("login");
    } else {
        navigateTo(AdState.activeTab);
    }
}

function renderAuthViews(view) {
    const loginForm = document.getElementById("login-form-container");
    const signupForm = document.getElementById("signup-form-container");
    
    if (view === "login") {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
    } else {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
    }
}

function renderPanelContent(tabName) {
    switch (tabName) {
        case "overview":
            renderKPIs();
            renderCharts();
            renderTopCampaigns();
            renderOverviewInsights();
            break;
        case "campaigns":
            renderCampaignsTable();
            break;
        case "copilot":
            renderChatHistory();
            break;
        case "insights":
            renderDetailedInsights();
            break;
    }
}

// KPI renderer with dynamic calculations matching reference image
function renderKPIs() {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let activeCampaignsCount = 0;
    let weakAdsCount = 0;
    let totalActiveRoiSum = 0;
    let totalActiveCtrSum = 0;

    AdState.campaigns.forEach(c => {
        if (c.status === "active") {
            totalSpend += c.spend;
            totalImpressions += c.impressions;
            totalClicks += c.clicks;
            totalConversions += c.conversions;
            activeCampaignsCount++;
            
            totalActiveRoiSum += c.roi;
            totalActiveCtrSum += c.ctr;

            // Weak Ad definition: Low ROI (< 1.6x) or low CTR (< 2.5%)
            if (c.roi < 1.6 || c.ctr < 2.5) {
                weakAdsCount++;
            }
        }
    });

    // Dynamic Ad Health Score Calculation
    let healthScore = 84; // Default fallback matching the screenshot
    let healthLabel = "Stable performance";
    
    if (activeCampaignsCount > 0) {
        const averageRoi = totalActiveRoiSum / activeCampaignsCount;
        const averageCtr = totalActiveCtrSum / activeCampaignsCount;
        
        // Map average yields onto 100pt scale
        const roiRating = Math.min(50, (averageRoi / 3.2) * 50);
        const ctrRating = Math.min(50, (averageCtr / 8.0) * 50);
        healthScore = Math.round(roiRating + ctrRating);
        
        if (healthScore >= 90) healthLabel = "Excellent performance";
        else if (healthScore >= 75) healthLabel = "Stable performance";
        else if (healthScore >= 50) healthLabel = "Moderate performance";
        else healthLabel = "Requires immediate optimization";
    }

    // Bind to DOM Elements
    const healthTextEl = document.getElementById("health-value-text");
    const healthNumberEl = document.getElementById("health-score-number");
    const healthCircleEl = document.getElementById("health-circle-indicator");
    
    if (healthTextEl) healthTextEl.textContent = healthLabel;
    if (healthNumberEl) healthNumberEl.textContent = healthScore;
    
    if (healthCircleEl) {
        // SVG circumference = 176 (2 * PI * 28)
        const offset = 176 - (176 * healthScore) / 100;
        healthCircleEl.setAttribute("stroke-dashoffset", offset);
        
        // Dynamic coloring depending on score
        if (healthScore >= 75) healthCircleEl.setAttribute("stroke", "#2563eb");
        else if (healthScore >= 50) healthCircleEl.setAttribute("stroke", "#eab308");
        else healthCircleEl.setAttribute("stroke", "#ea3838");
    }

    const spendEl = document.getElementById("kpi-spend");
    const activeEl = document.getElementById("kpi-active");
    const weakEl = document.getElementById("kpi-weak");
    
    if (spendEl) spendEl.textContent = `$${totalSpend.toLocaleString()}`;
    if (activeEl) activeEl.textContent = activeCampaignsCount;
    if (weakEl) weakEl.textContent = weakAdsCount;
}

// Chart sparklines matched to reference aesthetic
function renderCharts() {
    const spendChart = document.getElementById("spend-svg-path");
    const conversionChart = document.getElementById("conversion-svg-path");

    if (spendChart && conversionChart) {
        const activeCampaigns = AdState.campaigns.filter(c => c.status === "active");
        if (activeCampaigns.length === 0) return;

        let spendPoints = [];
        let conversionPoints = [];

        activeCampaigns.forEach((c, idx) => {
            const x = (idx / (activeCampaigns.length - 1 || 1)) * 360 + 20;
            const spendY = 100 - (c.spend / 2500) * 80;
            const convY = 100 - (c.conversions / 400) * 80;
            
            spendPoints.push(`${x},${spendY}`);
            conversionPoints.push(`${x},${convY}`);
        });

        spendChart.setAttribute("d", `M ${spendPoints.join(" L ")}`);
        conversionChart.setAttribute("d", `M ${conversionPoints.join(" L ")}`);
    }
}

// Render dynamic campaigns inside dashboard overview
function renderTopCampaigns() {
    // Find the campaign with highest ROI
    const activeCampaigns = AdState.campaigns.filter(c => c.status === "active");
    if (activeCampaigns.length === 0) return;
    
    // Sort descending by ROI to isolate top performer
    activeCampaigns.sort((a, b) => b.roi - a.roi);
    const top = activeCampaigns[0];
    
    const ctrEl = document.getElementById("top-perf-ctr");
    const convEl = document.getElementById("top-perf-conv");
    const roasEl = document.getElementById("top-perf-roas");
    
    if (ctrEl) ctrEl.textContent = `${top.ctr}%`;
    if (convEl) convEl.textContent = top.conversions;
    if (roasEl) roasEl.textContent = `${top.roi}x`;
}

function renderOverviewInsights() {
    // Already fully styled statically inside index.html for precise visual reproduction.
    // Wire up events dynamically
    const applyShiftBtn = document.getElementById("apply-ctr-shift-btn");
    if (applyShiftBtn) {
        applyShiftBtn.addEventListener("click", applyCTRShiftOptimization);
    }
}

// AI Growth Feed trigger: Shift budget dynamically
async function applyCTRShiftOptimization() {
    // Find Google campaign and Meta campaign to shift budgets
    const metaCamp = AdState.campaigns.find(c => c.platform === "meta");
    const googleCamp = AdState.campaigns.find(c => c.platform === "google");
    
    if (metaCamp && googleCamp) {
        metaCamp.budget += 500;
        metaCamp.spend += 320;
        metaCamp.conversions += 28;
        metaCamp.roi = parseFloat((metaCamp.conversions * 35 / metaCamp.spend).toFixed(2));
        
        googleCamp.budget -= 300;
        
        if (supabase && AdState.user.isLoggedIn) {
            try {
                await supabase
                    .from('campaigns')
                    .update({
                        budget: metaCamp.budget,
                        spend: metaCamp.spend,
                        conversions: metaCamp.conversions,
                        roi: metaCamp.roi
                    })
                    .eq('id', metaCamp.id);
                    
                await supabase
                    .from('campaigns')
                    .update({
                        budget: googleCamp.budget
                    })
                    .eq('id', googleCamp.id);
            } catch (err) {
                console.error("DB update error applying shift:", err);
            }
        }
        
        // Remove card or style as completed
        const alertCard = document.getElementById("apply-ctr-shift-btn").closest(".border-2");
        if (alertCard) {
            alertCard.style.transition = "all 0.5s ease";
            alertCard.style.opacity = "0.5";
            alertCard.style.borderColor = "#e2e8f0";
            alertCard.querySelector("button").disabled = true;
            alertCard.querySelector("button").textContent = "Shift Applied";
        }
        
        showToast("Budget shift applied successfully!");
        renderAll();
        await addBotMessage("Autonomous CTR Spike Optimization triggered: Shifted **$500/day** to Meta conversion assets immediately.");
    }
}

// Quick wins trigger
window.applyQuickWin = async function(winType) {
    if (winType === 'peak') {
        showToast("Peak Hour Optimization activated (+15% bid boost 6-9pm)");
        await addBotMessage("Peak Hour Optimization initialized. AI will automatically apply bid modifiers between **6:00 PM and 9:00 PM**.");
    } else if (winType === 'lookalike') {
        showToast("1% purchase lookalike segment created");
        await addBotMessage("Lookalike Audience Expansion complete: Synced **1% LAL (Past Buyers)** with your Meta Ad Account nodes.");
    } else if (winType === 'geo') {
        showToast("Geo-Targeting shift applied (+15% Canada reach)");
        await addBotMessage("Geo-Targeting modifications complete: Boosted Canada reach constraints to secure high-value longtail conversions.");
    }
};

// Toast notification helper
function showToast(message) {
    const toast = document.getElementById("system-toast");
    const msgEl = document.getElementById("toast-message");
    if (!toast || !msgEl) return;
    
    msgEl.textContent = message;
    toast.classList.remove("translate-x-80", "opacity-0");
    
    setTimeout(() => {
        toast.classList.add("translate-x-80", "opacity-0");
    }, 3500);
}

// Clear growth feed
window.clearGrowthFeed = function() {
    const container = document.getElementById("growth-feed-container");
    if (container) {
        container.innerHTML = `
            <div class="text-center py-6 text-slate-400 text-xs">
                No active optimization alerts. You're fully operational!
            </div>
        `;
    }
    showToast("Growth feed alerts cleared");
};

// Drag and drop video analyzer mock trigger
window.triggerMockVideoUpload = function() {
    showToast("Analyzing video hooks & branding metrics...");
    
    const panel = document.getElementById("video-analyzer-panel").querySelector(".min-h-\\[360px\\]");
    if (!panel) return;
    
    panel.innerHTML = `
        <div class="space-y-4 w-full max-w-md">
            <div class="flex items-center justify-between text-xs font-bold">
                <span>Hook Retention analysis...</span>
                <span class="animate-pulse">Active</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-primary h-2 rounded-full" style="width: 100%; transition: width 3.5s ease" id="analyzing-progress"></div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        panel.innerHTML = `
            <div class="w-full space-y-6">
                <div class="flex items-center justify-between border-b pb-3">
                    <h4 class="font-extrabold text-sm text-slate-800 dark:text-white">EcoBottle Video Ad Creative Analysis</h4>
                    <span class="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Complete</span>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div class="p-3 bg-blue-50/50 dark:bg-blue-950/20 border rounded-xl text-center">
                        <span class="text-[10px] text-slate-400 block uppercase">Hook Rate</span>
                        <span class="font-extrabold text-lg text-primary block mt-1">84.2%</span>
                    </div>
                    <div class="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border rounded-xl text-center">
                        <span class="text-[10px] text-slate-400 block uppercase">Hold Rate</span>
                        <span class="font-extrabold text-lg text-emerald-500 block mt-1">68.5%</span>
                    </div>
                    <div class="p-3 bg-violet-50/50 dark:bg-violet-950/20 border rounded-xl text-center">
                        <span class="text-[10px] text-slate-400 block uppercase">Score</span>
                        <span class="font-extrabold text-lg text-[#7c3aed] block mt-1">A+ Rating</span>
                    </div>
                </div>

                <div class="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl space-y-2">
                    <span class="text-xs font-bold text-slate-800 dark:text-white block">AI Creative Insights</span>
                    <ul class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                        <li>Visual hook features product shot within the first 1.2s, beating category norms by 40%.</li>
                        <li>Branding placement (Logo) is highly visible at the 8s retention surge.</li>
                        <li>High video hold score predicts robust conversions (+32% conversion estimate).</li>
                    </ul>
                </div>
                <button onclick="triggerMockVideoReset()" class="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition">Analyze Another Creative</button>
            </div>
        `;
        showToast("Analysis Complete!");
    }, 2500);
};

window.triggerMockVideoReset = function() {
    navigateTo("video-analyzer");
};

// Meta connect sync mock
window.triggerConnectNotification = function() {
    showToast("Meta API accounts synchronized successfully!");
    navigateTo("overview");
    addBotMessage("Successfully synced Meta Business nodes: AI automation and direct bid adjustments are fully operational.");
};

// AI Ad Creative Builder Logic
function runAdGenerator() {
    const promptInput = document.getElementById("prompt-textarea");
    const platformSelect = document.getElementById("platform-select");
    const goalSelect = document.getElementById("goal-select");
    const budgetInput = document.getElementById("generator-budget-input");
    
    if (!promptInput.value.trim()) {
        alert("Please enter a campaign prompt first.");
        return;
    }
    
    const loadingScreen = document.getElementById("generator-loading");
    const resultScreen = document.getElementById("generator-result");
    
    loadingScreen.classList.remove("hidden");
    resultScreen.classList.add("hidden");
    
    let processText = document.getElementById("loading-status-text");
    const statuses = [
        "Analyzing target demographics...",
        "Synthesizing visual and color concepts...",
        "Drafting high-converting ad copy variations...",
        "Modeling projected conversions and click-through rates..."
    ];
    
    let i = 0;
    processText.textContent = statuses[i];
    
    const interval = setInterval(() => {
        i++;
        if (i < statuses.length) {
            processText.textContent = statuses[i];
        } else {
            clearInterval(interval);
            loadingScreen.classList.add("hidden");
            resultScreen.classList.remove("hidden");
            
            const promptVal = promptInput.value.toLowerCase();
            let title = "Custom Campaign";
            let headline = "Revolutionize Your Daily Flow";
            let primaryText = "Experience the next level of design, performance, and luxury. Get started today.";
            let cta = "Learn More";
            
            if (promptVal.includes("bottle") || promptVal.includes("eco")) {
                title = "HydraEco - Pure Bottle";
                headline = "Hydrate Sustainably, Live Beautifully";
                primaryText = "Ditch single-use plastic. Handcrafted double-walled stainless steel designed to keep water cold for 24h. Save 20% this week.";
                cta = "Shop Now";
            } else if (promptVal.includes("saas") || promptVal.includes("software") || promptVal.includes("cloud")) {
                title = "WorkSync SaaS Platform";
                headline = "The Operating System for Modern Teams";
                primaryText = "Integrate your calendar, tasks, and communications in one elegant, lightning-fast workspace. Connect your first 10 members free.";
                cta = "Sign Up";
            }
            
            AdState.generatedAd = {
                name: `${title} AI Campaign`,
                platform: platformSelect.value,
                headline: headline,
                primaryText: primaryText,
                cta: cta,
                budget: parseInt(budgetInput.value) || 500,
                projectedCTR: (4.5 + Math.random() * 4).toFixed(2),
                projectedROI: (2.2 + Math.random() * 1.5).toFixed(2)
            };
            
            renderAdPreview();
        }
    }, 1000);
}

function renderAdPreview() {
    const previewContainer = document.getElementById("generator-result");
    if (!previewContainer || !AdState.generatedAd) return;
    
    const ad = AdState.generatedAd;
    const bannerColor = ad.platform === "meta" ? "from-[#2563eb] to-[#7c3aed]" : ad.platform === "google" ? "from-[#ea3838] to-[#eab308]" : "from-[#000000] to-[#00f2fe]";
    
    previewContainer.innerHTML = `
        <div class="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/40 rounded-xl overflow-hidden shadow-md">
            <!-- Platform Header -->
            <div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/40">
                <div class="flex items-center space-x-2">
                    <span class="material-symbols-outlined text-primary text-sm">${ad.platform === "meta" ? "facebook" : ad.platform === "google" ? "search" : "music_note"}</span>
                    <span class="text-xs text-slate-800 dark:text-slate-350 capitalize font-bold">${ad.platform} Ad Mockup</span>
                </div>
                <span class="text-[9px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full font-bold">Generated</span>
            </div>
            
            <div class="p-4 space-y-4">
                <p class="text-xs text-slate-500 leading-relaxed font-semibold">${ad.primaryText}</p>
                
                <!-- Graphic Cover Placeholder -->
                <div class="h-32 bg-gradient-to-tr ${bannerColor} rounded-xl flex flex-col justify-end p-4 text-white relative group overflow-hidden shadow-inner">
                    <div class="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                    <div class="relative z-10 space-y-1">
                        <span class="text-[8px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">AdAgent AI Generated</span>
                        <h3 class="font-extrabold text-sm leading-tight text-white">${ad.headline}</h3>
                    </div>
                </div>
                
                <!-- Action Footer -->
                <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    <div class="min-w-0">
                        <span class="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold truncate">${ad.name}</span>
                        <span class="font-extrabold text-xs text-slate-800 dark:text-white block truncate">${ad.headline}</span>
                    </div>
                    <button class="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm shrink-0">${ad.cta}</button>
                </div>
            </div>
        </div>
        
        <!-- Metrics forecast cards -->
        <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl text-center shadow-sm">
                <span class="text-[9px] text-slate-450 block uppercase font-bold">Projected CTR</span>
                <span class="font-extrabold text-lg text-primary block mt-0.5">${ad.projectedCTR}%</span>
            </div>
            <div class="p-3 bg-violet-50/50 dark:bg-violet-950/20 border border-slate-100 dark:border-slate-800/40 rounded-xl text-center shadow-sm">
                <span class="text-[9px] text-slate-450 block uppercase font-bold">Projected ROAS</span>
                <span class="font-extrabold text-lg text-[#7c3aed] block mt-0.5">${ad.projectedROI}x</span>
            </div>
        </div>
        
        <button id="deploy-generated-ad-btn" class="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-xl hover:shadow-lg transition">Deploy Ad Live</button>
    `;

    const depBtn = document.getElementById("deploy-generated-ad-btn");
    if (depBtn) {
        depBtn.addEventListener("click", deployGeneratedAd);
    }
}

async function deployGeneratedAd() {
    if (!AdState.generatedAd) return;
    
    const ad = AdState.generatedAd;
    
    const newCamp = {
        name: ad.name,
        platform: ad.platform,
        status: "active",
        budget: ad.budget,
        impressions: 4200,
        clicks: 280,
        conversions: 12,
        roi: parseFloat(ad.projectedROI),
        ctr: parseFloat(ad.projectedCTR),
        spend: 40,
        dateCreated: new Date().toISOString().split("T")[0]
    };

    if (supabase && AdState.user.isLoggedIn) {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .insert({
                    name: newCamp.name,
                    platform: newCamp.platform,
                    status: newCamp.status,
                    budget: newCamp.budget,
                    impressions: newCamp.impressions,
                    clicks: newCamp.clicks,
                    conversions: newCamp.conversions,
                    roi: newCamp.roi,
                    ctr: newCamp.ctr,
                    spend: newCamp.spend,
                    date_created: newCamp.dateCreated,
                    user_id: AdState.user.id
                })
                .select();
                
            if (error) throw error;
            
            if (data && data[0]) {
                newCamp.id = data[0].id;
            }
        } catch (err) {
            console.error("Failed to deploy generated ad to Supabase DB:", err);
            newCamp.id = AdState.campaigns.length + 1;
        }
    } else {
        newCamp.id = AdState.campaigns.length + 1;
    }
    
    AdState.campaigns.push(newCamp);
    AdState.generatedAd = null;
    
    // Close modal
    toggleCampaignGeneratorModal(false);
    
    // Smooth navigation into manager
    navigateTo("campaigns");
    const botReply = `Outstanding! I have deployed **${newCamp.name}** live on ${newCamp.platform}. We're starting to gather impressions.`;
    await addBotMessage(botReply);
    showToast("Ad Deployed successfully!");
}

function renderGeneratorView() {
    const resultScreen = document.getElementById("generator-result");
    const placeholderScreen = document.getElementById("generator-placeholder");
    
    if (!AdState.generatedAd) {
        resultScreen.classList.add("hidden");
        placeholderScreen.classList.remove("hidden");
    } else {
        resultScreen.classList.remove("hidden");
        placeholderScreen.classList.add("hidden");
        renderAdPreview();
    }
}

// Campaign List Manager Panel
function renderCampaignsTable() {
    const tableBody = document.getElementById("campaigns-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    AdState.campaigns.forEach(c => {
        const platformIconClass = c.platform === "meta" ? "facebook" : c.platform === "google" ? "search" : c.platform === "tiktok" ? "music_note" : "work";
        const badgeColor = c.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : c.status === "paused" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-slate-400/10 text-slate-500";
        
        const rowHtml = `
            <tr class="border-b border-outline-variant/30 hover:bg-slate-50/40 dark:hover:bg-slate-900/40 transition">
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <span class="material-symbols-outlined text-primary text-lg">${platformIconClass}</span>
                        <span class="font-bold text-slate-800 dark:text-white text-xs">${c.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] capitalize font-bold ${badgeColor}">
                        ${c.status}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <span class="text-xs font-bold text-slate-800 dark:text-white">$${c.budget.toLocaleString()}</span>
                        ${c.status !== "draft" ? `<input type="range" min="100" max="10000" step="100" value="${c.budget}" data-id="${c.id}" class="campaign-budget-slider w-20 accent-primary h-1 rounded-full cursor-pointer bg-slate-100">` : ""}
                    </div>
                </td>
                <td class="px-6 py-4 font-bold text-xs text-slate-850 dark:text-slate-200">${c.impressions.toLocaleString()}</td>
                <td class="px-6 py-4 font-bold text-xs text-slate-850 dark:text-slate-200">${c.clicks.toLocaleString()}</td>
                <td class="px-6 py-4 font-bold text-xs text-slate-850 dark:text-slate-200">${c.conversions.toLocaleString()}</td>
                <td class="px-6 py-4 font-bold text-xs text-primary">${c.roi > 0 ? c.roi + "x" : "N/A"}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        ${c.status === "active" ? 
                            `<button data-id="${c.id}" data-action="paused" class="toggle-status-btn p-1 text-slate-400 hover:text-amber-500 transition" title="Pause"><span class="material-symbols-outlined text-lg">pause_circle</span></button>` : 
                            c.status === "paused" ? 
                            `<button data-id="${c.id}" data-action="active" class="toggle-status-btn p-1 text-slate-400 hover:text-emerald-500 transition" title="Resume"><span class="material-symbols-outlined text-lg">play_circle</span></button>` : 
                            `<button data-id="${c.id}" data-action="active" class="toggle-status-btn p-1 text-slate-400 hover:text-primary transition" title="Launch"><span class="material-symbols-outlined text-lg">rocket_launch</span></button>`
                        }
                        <button data-id="${c.id}" class="delete-campaign-btn p-1 text-slate-400 hover:text-error transition" title="Delete"><span class="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", rowHtml);
    });

    // Wire up events dynamically
    document.querySelectorAll(".campaign-budget-slider").forEach(slider => {
        slider.addEventListener("change", (e) => {
            const id = parseInt(e.target.getAttribute("data-id"));
            updateCampaignBudget(id, e.target.value);
        });
    });

    document.querySelectorAll(".toggle-status-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.target.closest("button");
            const id = parseInt(button.getAttribute("data-id"));
            const action = button.getAttribute("data-action");
            toggleCampaignStatus(id, action);
        });
    });

    document.querySelectorAll(".delete-campaign-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const button = e.target.closest("button");
            const id = parseInt(button.getAttribute("data-id"));
            deleteCampaign(id);
        });
    });
}

async function updateCampaignBudget(id, newBudget) {
    const camp = AdState.campaigns.find(c => c.id === id);
    if (camp) {
        const oldBudget = camp.budget;
        camp.budget = parseInt(newBudget);
        camp.conversions = Math.round(camp.conversions * (newBudget / oldBudget)) || 0;
        
        if (supabase && AdState.user.isLoggedIn) {
            try {
                await supabase
                    .from('campaigns')
                    .update({
                        budget: camp.budget,
                        conversions: camp.conversions
                    })
                    .eq('id', id);
            } catch (err) {
                console.error("Failed to update campaign budget in Supabase:", err);
            }
        }

        showToast("Budget node modified successfully.");
        renderAll();
    }
}

async function toggleCampaignStatus(id, newStatus) {
    const camp = AdState.campaigns.find(c => c.id === id);
    if (camp) {
        camp.status = newStatus;
        if (newStatus === "active" && camp.impressions === 0) {
            camp.impressions = 2400;
            camp.clicks = 120;
            camp.spend = 50;
            camp.roi = 1.8;
        }

        if (supabase && AdState.user.isLoggedIn) {
            try {
                await supabase
                    .from('campaigns')
                    .update({
                        status: camp.status,
                        impressions: camp.impressions,
                        clicks: camp.clicks,
                        spend: camp.spend,
                        roi: camp.roi
                    })
                    .eq('id', id);
            } catch (err) {
                console.error("Failed to toggle campaign status in Supabase:", err);
            }
        }
        
        showToast(`Campaign is now ${newStatus.toUpperCase()}`);
        renderAll();
        await addBotMessage(`Campaign **${camp.name}** is now **${newStatus.toUpperCase()}**.`);
    }
}

async function deleteCampaign(id) {
    const idx = AdState.campaigns.findIndex(c => c.id === id);
    if (idx !== -1) {
        const name = AdState.campaigns[idx].name;
        
        if (supabase && AdState.user.isLoggedIn) {
            try {
                await supabase
                    .from('campaigns')
                    .delete()
                    .eq('id', id);
            } catch (err) {
                console.error("Failed to delete campaign from Supabase:", err);
            }
        }

        AdState.campaigns.splice(idx, 1);
        showToast("Campaign deleted successfully");
        renderAll();
        await addBotMessage(`Permanently deleted campaign **${name}**.`);
    }
}

// AI Copilot Chat Engine
function renderChatHistory() {
    const chatContainer = document.getElementById("chat-messages-container");
    if (!chatContainer) return;
    
    chatContainer.innerHTML = "";
    
    AdState.chatHistory.forEach((msg, msgIdx) => {
        const isBot = msg.sender === "bot";
        const alignment = isBot ? "justify-start" : "justify-end";
        const bubbleBg = isBot ? "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 text-on-background rounded-bl-none" : "bg-primary text-white rounded-br-none";
        
        let actionButtonsHtml = "";
        if (isBot && msg.actions && msg.actions.length > 0) {
            actionButtonsHtml = `
                <div class="flex flex-wrap gap-1 mt-2">
                    ${msg.actions.map((act, actIdx) => `
                        <button data-msg-idx="${msgIdx}" data-act-idx="${actIdx}" class="chat-action-trigger px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg transition border border-primary/20 dark:bg-white/5 dark:text-white dark:border-white/10">
                            ${act.label}
                        </button>
                    `).join("")}
                </div>
            `;
        }
        
        const bubbleHtml = `
            <div class="flex ${alignment} w-full fade-in">
                <div class="max-w-[80%] flex space-x-2">
                    ${isBot ? `
                        <div class="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-primary text-sm">smart_toy</span>
                        </div>
                    ` : ""}
                    <div class="p-4 rounded-xl shadow-sm ${bubbleBg}">
                        <p class="text-xs leading-relaxed font-semibold">${markdownToHtml(msg.text)}</p>
                        ${actionButtonsHtml}
                        <span class="text-[8px] opacity-65 block mt-1.5 text-right">${msg.time}</span>
                    </div>
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML("beforeend", bubbleHtml);
    });

    // Wire up events dynamically
    document.querySelectorAll(".chat-action-trigger").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const msgIdx = parseInt(e.target.getAttribute("data-msg-idx"));
            const actIdx = parseInt(e.target.getAttribute("data-act-idx"));
            const command = AdState.chatHistory[msgIdx].actions[actIdx].command;
            handleChatAction(command);
        });
    });
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendUserMessage() {
    const input = document.getElementById("chat-user-input");
    if (!input || !input.value.trim()) return;
    
    const text = input.value.trim();
    input.value = "";
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    AdState.chatHistory.push({
        sender: "user",
        text: text,
        time: time
    });
    
    renderChatHistory();
    await saveChatMessage("user", text, null, time);
    
    setTimeout(() => {
        processBotResponse(text);
    }, 800);
}

async function processBotResponse(query) {
    const lower = query.toLowerCase();
    let reply = "I didn't quite capture that context. You can instruct me to **'optimize campaigns'**, **'show ROI report'**, or **'pause [platform]'**.";
    let actions = [];
    
    if (lower.includes("optimize") || lower.includes("help")) {
        reply = "AdAgent Optimizer is active! I suggest the following actions to boost click yields:\n\n1. **Meta Ads**: Boost budget by **$200** to exploit current CTR spike.\n2. **TikTok Ads**: Refresh catalog ad headlines to optimize user retention.";
        actions = [
            { label: "Boost Meta Budget", command: "apply budget meta" },
            { label: "Open Generator", command: "nav generator" }
        ];
    } else if (lower.includes("report") || lower.includes("roi")) {
        const active = AdState.campaigns.filter(c => c.status === "active");
        const listText = active.map(c => `• **${c.name}**: ${c.roi}x ROI`).join("\n");
        reply = `Here is your current campaign **ROI Snapshot**:\n\n${listText}\n\nOverall average ROI is positive and stable at **2.98x**!`;
    } else if (lower.includes("meta") || lower.includes("facebook")) {
        reply = "Do you want me to optimize your Meta campaign budget or toggle its run state?";
        actions = [
            { label: "Increase Meta Budget", command: "apply budget meta" },
            { label: "Show Meta Dashboard", command: "nav overview" }
        ];
    } else if (lower.includes("nav")) {
        const dest = lower.split(" ")[1];
        if (["overview", "generator", "campaigns", "copilot", "insights", "settings"].includes(dest)) {
            navigateTo(dest);
            reply = `Navigated directly to the **${dest.toUpperCase()}** board!`;
        }
    } else if (lower.includes("apply budget meta")) {
        const metaCamp = AdState.campaigns.find(c => c.platform === "meta");
        if (metaCamp) {
            const oldBudget = metaCamp.budget;
            metaCamp.budget += 300;
            metaCamp.spend += 180;
            if (supabase && AdState.user.isLoggedIn) {
                try {
                    await supabase
                        .from('campaigns')
                        .update({
                            budget: metaCamp.budget,
                            spend: metaCamp.spend
                        })
                        .eq('id', metaCamp.id);
                } catch (err) {
                    console.error("Failed to apply chat budget optimization:", err);
                }
            }
            renderAll();
            reply = "Budget for **Meta Conversion Ad** has successfully been boosted by **$300**! Charts are realigned.";
        }
    }
    
    await addBotMessage(reply, actions);
}

async function addBotMessage(text, actions = []) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    AdState.chatHistory.push({
        sender: "bot",
        text: text,
        time: time,
        actions: actions
    });
    renderChatHistory();
    await saveChatMessage("bot", text, actions, time);
}

function handleChatAction(command) {
    if (command.startsWith("nav ")) {
        const tab = command.split(" ")[1];
        if (tab === "generator") {
            toggleCampaignGeneratorModal(true);
        } else {
            navigateTo(tab);
        }
    } else {
        processBotResponse(command);
    }
}

// Simple Helper to map bold markdown formatting
function markdownToHtml(text) {
    return text
        .replace(/\*\*(.*?)\*\"/g, '<strong>$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// Detailed Insights Tab Render
function renderDetailedInsights() {
    // Already fully styled statically inside index.html for precise visual reproduction.
}

// Live Fluctuation Simulation to make the graphs feel live
function startRealtimeAnalytics() {
    setInterval(() => {
        if (!AdState.user.isLoggedIn) return;
        
        AdState.campaigns.forEach(c => {
            if (c.status === "active") {
                c.impressions += Math.floor(Math.random() * 8) + 1;
                c.clicks += Math.floor(Math.random() * 2);
                if (Math.random() > 0.85) {
                    c.conversions += 1;
                }
                c.ctr = parseFloat(((c.clicks / c.impressions) * 100).toFixed(2)) || 0;
            }
        });
        
        if (AdState.activeTab === "overview") {
            renderKPIs();
            renderCharts();
        } else if (AdState.activeTab === "campaigns") {
            renderCampaignsTable();
        }
    }, 3000);
}

// Helper to toggle auth button states while performing requests
function showAuthLoading(isLoading, message = "") {
    const loginBtn = document.querySelector("#login-form button[type='submit']");
    const signupBtn = document.querySelector("#signup-form button[type='submit']");
    
    if (isLoading) {
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = `<span class="inline-block animate-pulse mr-1">⚡</span> ${message}`;
        }
        if (signupBtn) {
            signupBtn.disabled = true;
            signupBtn.innerHTML = `<span class="inline-block animate-pulse mr-1">⚡</span> ${message}`;
        }
    } else {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = "Sign In";
        }
        if (signupBtn) {
            signupBtn.disabled = false;
            signupBtn.textContent = "Create Account";
        }
    }
}

// Event Listeners wiring
function setupEventListeners() {
    // Nav links
    const links = document.querySelectorAll(".sidebar-link");
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navigateTo(link.getAttribute("data-tab"));
        });
    });
    
    // Auth Forms Submission
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;
            
            showAuthLoading(true, "Signing in...");
            
            if (supabase) {
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) throw error;
                    
                    if (data && data.user) {
                        AdState.user.isLoggedIn = true;
                        AdState.user.id = data.user.id;
                        AdState.user.email = data.user.email;
                        AdState.user.name = data.user.user_metadata?.full_name || data.user.email.split("@")[0];
                        
                        await fetchCampaigns();
                        await fetchChatHistory();
                        
                        startRealtimeAnalytics();
                        navigateTo("overview");
                        await addBotMessage(`Welcome back, **${AdState.user.name}**! Let's maximize your ad conversion metrics today.`);
                    }
                } catch (err) {
                    alert(`Auth Error: ${err.message || err}`);
                } finally {
                    showAuthLoading(false);
                }
            } else {
                // Local fallback simulation
                setTimeout(async () => {
                    AdState.user.isLoggedIn = true;
                    AdState.user.email = email;
                    AdState.user.name = email.split("@")[0];
                    AdState.campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
                    AdState.chatHistory = JSON.parse(JSON.stringify(MOCK_CHAT_HISTORY));
                    
                    showAuthLoading(false);
                    navigateTo("overview");
                    await addBotMessage(`Welcome back, **${AdState.user.name}**! Running in premium local simulation mode.`);
                }, 800);
            }
        });
    }
    
    const signupForm = document.getElementById("signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("signup-name").value.trim();
            const email = document.getElementById("signup-email").value.trim();
            const password = document.getElementById("signup-password").value;
            
            showAuthLoading(true, "Creating Workspace...");
            
            if (supabase) {
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: name
                            }
                        }
                    });
                    
                    if (error) throw error;
                    
                    if (data && data.user) {
                        if (data.session) {
                            AdState.user.isLoggedIn = true;
                            AdState.user.id = data.user.id;
                            AdState.user.email = data.user.email;
                            AdState.user.name = name;
                            
                            await fetchCampaigns();
                            await fetchChatHistory();
                            
                            startRealtimeAnalytics();
                            navigateTo("overview");
                            await addBotMessage(`Welcome to AdAgent AI, **${name}**! I've pre-configured your default advertising nodes. Enter a prompt in the **AI Campaign Generator** to construct your first ad!`);
                        } else {
                            alert("Workspace setup successful! Please check your email for the confirmation link, then sign in.");
                            navigateTo("login");
                        }
                    }
                } catch (err) {
                    alert(`Workspace Error: ${err.message || err}`);
                } finally {
                    showAuthLoading(false);
                }
            } else {
                // Local fallback simulation
                setTimeout(async () => {
                    AdState.user.isLoggedIn = true;
                    AdState.user.email = email;
                    AdState.user.name = name;
                    AdState.campaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
                    AdState.chatHistory = JSON.parse(JSON.stringify(MOCK_CHAT_HISTORY));
                    
                    showAuthLoading(false);
                    navigateTo("overview");
                    await addBotMessage(`Welcome to AdAgent AI, **${name}**! Running in premium local simulation mode.`);
                }, 800);
            }
        });
    }

    // Sign out button trigger
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (supabase) {
                try {
                    await supabase.auth.signOut();
                } catch (err) {
                    console.error("Sign out error:", err);
                }
            }
            
            // Reset local states completely
            AdState.user.isLoggedIn = false;
            AdState.user.id = null;
            AdState.user.email = "akshat@adagent.ai";
            AdState.user.name = "Akshat";
            AdState.campaigns = [];
            AdState.chatHistory = [];
            
            navigateTo("login");
        });
    }

    // Generator trigger
    const genBtn = document.getElementById("generate-ad-btn");
    if (genBtn) {
        genBtn.addEventListener("click", runAdGenerator);
    }
    
    // Chat Send button
    const chatSendBtn = document.getElementById("chat-send-btn");
    if (chatSendBtn) {
        chatSendBtn.addEventListener("click", sendUserMessage);
    }
    
    const chatInput = document.getElementById("chat-user-input");
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                sendUserMessage();
            }
        });
    }
}
