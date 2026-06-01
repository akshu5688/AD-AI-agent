/* ==========================================
   AdAgent AI - Interactive Application Engine
   ========================================== */

import './index.css';
import { createClient } from '@supabase/supabase-js';

// Safe environment configuration (Vercel & Supabase integration)
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
const AdState = {
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

// Mock Data for fallback and new user initialization
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
        roi: 3.12, // 312%
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
        roi: 2.85, // 285%
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
        roi: 1.45, // 145%
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
    
    // Update user display details in the sidebar bottom
    if (AdState.user.isLoggedIn) {
        const nameSpan = document.getElementById("user-name-span");
        const avatarDiv = document.getElementById("user-avatar");
        if (nameSpan) nameSpan.textContent = AdState.user.name;
        if (avatarDiv) avatarDiv.textContent = AdState.user.name.charAt(0).toUpperCase();
    }
    
    // Manage root views
    const authView = document.getElementById("auth-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    if (tabName === "login" || tabName === "signup") {
        authView.classList.remove("hidden");
        dashboardView.classList.add("hidden");
        renderAuthViews(tabName);
    } else {
        authView.classList.add("hidden");
        dashboardView.classList.remove("hidden");
        
        // Update sidebar visual active states
        const links = document.querySelectorAll(".sidebar-link");
        links.forEach(link => {
            if (link.getAttribute("data-tab") === tabName) {
                link.classList.add("active", "bg-primary-container/10", "text-primary");
                link.classList.remove("text-outline");
            } else {
                link.classList.remove("active", "bg-primary-container/10", "text-primary");
                link.classList.add("text-outline");
            }
        });
        
        // Show active panel content
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

// Dynamic Renderers
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
        case "generator":
            renderGeneratorView();
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

// Render Overview KPI cards
function renderKPIs() {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let activeCampaignsCount = 0;

    AdState.campaigns.forEach(c => {
        if (c.status === "active") {
            totalSpend += c.spend;
            totalImpressions += c.impressions;
            totalClicks += c.clicks;
            totalConversions += c.conversions;
            activeCampaignsCount++;
        }
    });

    const averageCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    const averageRoi = totalSpend > 0 ? ((totalConversions * 35 + totalClicks * 0.5) / totalSpend).toFixed(2) : 0;

    document.getElementById("kpi-spend").textContent = `$${totalSpend.toLocaleString()}`;
    document.getElementById("kpi-impressions").textContent = totalImpressions.toLocaleString();
    document.getElementById("kpi-clicks").textContent = totalClicks.toLocaleString();
    document.getElementById("kpi-conversions").textContent = totalConversions.toLocaleString();
    document.getElementById("kpi-ctr").textContent = `${averageCtr}%`;
    document.getElementById("kpi-roi").textContent = `${averageRoi}x`;
    document.getElementById("active-campaigns-pill").textContent = `${activeCampaignsCount} Active`;
}

// Dynamic Animated SVG charts
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
    const listContainer = document.getElementById("top-campaigns-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    AdState.campaigns.forEach(c => {
        const platformIconClass = c.platform === "meta" ? "facebook" : c.platform === "google" ? "search" : c.platform === "tiktok" ? "music_note" : "work";
        const statusColor = c.status === "active" ? "bg-emerald-500" : c.status === "paused" ? "bg-amber-500" : "bg-slate-400";
        
        const cardHtml = `
            <div class="flex items-center justify-between p-md bg-surface-container-low border border-outline-variant/30 rounded-xl glass-card-hover">
                <div class="flex items-center space-x-md">
                    <div class="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-outline-variant/30 relative">
                        <span class="material-symbols-outlined text-primary text-xl">${platformIconClass}</span>
                        <div class="absolute -top-1 -right-1 w-3 h-3 ${statusColor} rounded-full border-2 border-surface-container-lowest"></div>
                    </div>
                    <div>
                        <h4 class="font-medium text-on-background text-body-md truncate max-w-[180px]">${c.name}</h4>
                        <div class="flex items-center space-x-sm text-label-md text-outline">
                            <span class="capitalize">${c.platform}</span>
                            <span>•</span>
                            <span>ROI: ${c.roi > 0 ? c.roi + "x" : "N/A"}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <span class="font-semibold text-on-background text-body-md block">$${c.spend.toLocaleString()}</span>
                    <span class="text-label-md text-outline block">Spend</span>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML("beforeend", cardHtml);
    });
}

function renderOverviewInsights() {
    const insightsContainer = document.getElementById("overview-insights-box");
    if (!insightsContainer) return;
    
    insightsContainer.innerHTML = `
        <div class="space-y-md">
            <div class="flex items-start space-x-sm bg-primary/5 p-sm rounded-lg border border-primary/10">
                <span class="material-symbols-outlined text-primary mt-xs">insights</span>
                <div class="text-body-sm text-on-background">
                    <strong class="text-primary">ROI Maximizer Tip:</strong> Increase the <strong>Google Search Lead Gen</strong> budget by 15%. Projected conversions could improve by <strong>+18.4%</strong>.
                    <button id="apply-opt-kpi-btn" class="mt-sm block px-sm py-xs bg-primary text-white text-label-md font-semibold rounded-lg hover:bg-primary-container transition">Apply with 1-Click</button>
                </div>
            </div>
            <div class="flex items-start space-x-sm bg-secondary/5 p-sm rounded-lg border border-secondary/10">
                <span class="material-symbols-outlined text-secondary mt-xs">trending_down</span>
                <div class="text-body-sm text-on-background">
                    <strong class="text-secondary">Performance Alert:</strong> TikTok catalog ad CTR has dropped below 2.0%. Creative refreshing is recommended.
                </div>
            </div>
        </div>
    `;

    const optBtn = document.getElementById("apply-opt-kpi-btn");
    if (optBtn) {
        // Tie to the campaign with Platform Google or custom index
        const googleCampaign = AdState.campaigns.find(c => c.platform === "google");
        const targetId = googleCampaign ? googleCampaign.id : (AdState.campaigns[1]?.id || 2);
        optBtn.addEventListener("click", () => applyAIOptimization(targetId, 400));
    }
}

// Optimization Applier
async function applyAIOptimization(campaignId, budgetIncrease) {
    const campaign = AdState.campaigns.find(c => c.id === campaignId);
    if (campaign) {
        campaign.budget += budgetIncrease;
        campaign.spend += Math.round(budgetIncrease * 0.6);
        campaign.conversions += Math.round(budgetIncrease * 0.15);
        campaign.roi = parseFloat((campaign.conversions * 35 / campaign.spend).toFixed(2));
        
        AdState.optimizationApplied = true;

        if (supabase && AdState.user.isLoggedIn) {
            try {
                await supabase
                    .from('campaigns')
                    .update({
                        budget: campaign.budget,
                        spend: campaign.spend,
                        conversions: campaign.conversions,
                        roi: campaign.roi
                    })
                    .eq('id', campaignId);
            } catch (err) {
                console.error("Failed to update optimized campaign in DB:", err);
            }
        }
        
        renderAll();
        
        // Notify user via AI Chat
        const text = `Perfect! I have applied the recommendation and increased the budget for **${campaign.name}** by **$${budgetIncrease}**. Analytics have updated in real time.`;
        await addBotMessage(text);
    }
}

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
    const previewContainer = document.getElementById("generated-ad-card");
    if (!previewContainer || !AdState.generatedAd) return;
    
    const ad = AdState.generatedAd;
    const bannerColor = ad.platform === "meta" ? "from-[#2563eb] to-[#712ae2]" : ad.platform === "google" ? "from-[#db4437] to-[#f4b400]" : "from-[#000000] to-[#00f2fe]";
    
    previewContainer.innerHTML = `
        <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-md">
            <!-- Platform Header -->
            <div class="flex items-center justify-between p-sm border-b border-outline-variant/20 bg-surface-container-low">
                <div class="flex items-center space-x-sm">
                    <span class="material-symbols-outlined text-primary">${ad.platform === "meta" ? "facebook" : ad.platform === "google" ? "search" : "music_note"}</span>
                    <span class="text-label-md text-on-background capitalize font-bold">${ad.platform} Ad Mockup</span>
                </div>
                <span class="text-xs text-outline bg-surface px-sm py-[2px] rounded-full">Preview</span>
            </div>
            
            <div class="p-md space-y-md">
                <!-- Ad Body Text -->
                <p class="text-body-sm text-on-background/80 leading-relaxed font-body-md">${ad.primaryText}</p>
                
                <!-- Graphic Cover Placeholder -->
                <div class="h-44 bg-gradient-to-tr ${bannerColor} rounded-lg flex flex-col justify-end p-md text-white relative group overflow-hidden">
                    <div class="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                    <div class="relative z-10 space-y-xs">
                        <span class="text-[10px] bg-white/20 backdrop-blur-md px-sm py-[2px] rounded-full uppercase tracking-wider font-semibold">AdAgent AI Generated</span>
                        <h3 class="font-bold text-lg leading-tight text-white">${ad.headline}</h3>
                    </div>
                </div>
                
                <!-- Action Footer -->
                <div class="flex items-center justify-between bg-surface-container-low p-sm rounded-lg border border-outline-variant/20">
                    <div>
                        <span class="text-[11px] text-outline block uppercase tracking-wider font-semibold">${ad.name}</span>
                        <span class="font-bold text-body-sm text-on-background block">${ad.headline}</span>
                    </div>
                    <button class="px-md py-sm bg-primary-container text-white text-label-md font-bold rounded-lg">${ad.cta}</button>
                </div>
            </div>
        </div>
        
        <!-- Metrics forecast cards -->
        <div class="grid grid-cols-2 gap-sm">
            <div class="p-sm bg-primary/5 border border-primary/10 rounded-xl text-center">
                <span class="text-label-md text-outline block">Projected CTR</span>
                <span class="font-bold text-headline-md text-primary block mt-xs">${ad.projectedCTR}%</span>
            </div>
            <div class="p-sm bg-secondary/5 border border-secondary/10 rounded-xl text-center">
                <span class="text-label-md text-outline block">Projected ROI</span>
                <span class="font-bold text-headline-md text-secondary block mt-xs">${ad.projectedROI}x</span>
            </div>
        </div>
        
        <button id="deploy-generated-ad-btn" class="w-full py-md bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg transition">Deploy Ad Live</button>
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
    
    // Smooth navigation into manager
    navigateTo("campaigns");
    const botReply = `Outstanding! I have deployed **${newCamp.name}** live on ${newCamp.platform}. We're starting to gather impressions.`;
    await addBotMessage(botReply);
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
            <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition">
                <td class="px-gutter py-md">
                    <div class="flex items-center space-x-sm">
                        <span class="material-symbols-outlined text-primary text-xl">${platformIconClass}</span>
                        <span class="font-medium text-on-background text-body-sm">${c.name}</span>
                    </div>
                </td>
                <td class="px-gutter py-md">
                    <span class="px-sm py-[2px] rounded-full text-label-md capitalize font-semibold ${badgeColor}">
                        ${c.status}
                    </span>
                </td>
                <td class="px-gutter py-md">
                    <div class="flex items-center space-x-sm">
                        <span class="text-body-sm font-semibold text-on-background">$${c.budget.toLocaleString()}</span>
                        ${c.status !== "draft" ? `<input type="range" min="100" max="10000" step="100" value="${c.budget}" data-id="${c.id}" class="campaign-budget-slider w-20 accent-primary h-1 rounded-full cursor-pointer">` : ""}
                    </div>
                </td>
                <td class="px-gutter py-md font-semibold text-body-sm text-on-background">${c.impressions.toLocaleString()}</td>
                <td class="px-gutter py-md font-semibold text-body-sm text-on-background">${c.clicks.toLocaleString()}</td>
                <td class="px-gutter py-md font-semibold text-body-sm text-on-background">${c.conversions.toLocaleString()}</td>
                <td class="px-gutter py-md font-semibold text-body-sm text-primary">${c.roi > 0 ? c.roi + "x" : "N/A"}</td>
                <td class="px-gutter py-md">
                    <div class="flex items-center space-x-sm">
                        ${c.status === "active" ? 
                            `<button data-id="${c.id}" data-action="paused" class="toggle-status-btn p-xs text-outline hover:text-amber-500" title="Pause"><span class="material-symbols-outlined text-xl">pause_circle</span></button>` : 
                            c.status === "paused" ? 
                            `<button data-id="${c.id}" data-action="active" class="toggle-status-btn p-xs text-outline hover:text-emerald-500" title="Resume"><span class="material-symbols-outlined text-xl">play_circle</span></button>` : 
                            `<button data-id="${c.id}" data-action="active" class="toggle-status-btn p-xs text-outline hover:text-primary" title="Launch"><span class="material-symbols-outlined text-xl">rocket_launch</span></button>`
                        }
                        <button data-id="${c.id}" class="delete-campaign-btn p-xs text-outline hover:text-error" title="Delete"><span class="material-symbols-outlined text-xl">delete</span></button>
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
        const bubbleBg = isBot ? "bg-surface-container-low border border-outline-variant/30 text-on-background rounded-bl-none" : "bg-primary text-white rounded-br-none";
        
        let actionButtonsHtml = "";
        if (isBot && msg.actions && msg.actions.length > 0) {
            actionButtonsHtml = `
                <div class="flex flex-wrap gap-xs mt-sm">
                    ${msg.actions.map((act, actIdx) => `
                        <button data-msg-idx="${msgIdx}" data-act-idx="${actIdx}" class="chat-action-trigger px-sm py-xs bg-primary/10 hover:bg-primary/20 text-primary text-label-md font-semibold rounded-lg transition border border-primary/20 dark:bg-white/5 dark:text-white dark:border-white/10">
                            ${act.label}
                        </button>
                    `).join("")}
                </div>
            `;
        }
        
        const bubbleHtml = `
            <div class="flex ${alignment} w-full fade-in">
                <div class="max-w-[80%] flex space-x-sm">
                    ${isBot ? `
                        <div class="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-primary text-sm">smart_toy</span>
                        </div>
                    ` : ""}
                    <div class="p-md rounded-xl shadow-sm ${bubbleBg}">
                        <p class="text-body-sm leading-relaxed">${markdownToHtml(msg.text)}</p>
                        ${actionButtonsHtml}
                        <span class="text-[9px] opacity-60 block mt-xs text-right">${msg.time}</span>
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
        navigateTo(tab);
    } else {
        processBotResponse(command);
    }
}

// Simple Helper to map bold markdown formatting
function markdownToHtml(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// Detailed Insights Tab Render
function renderDetailedInsights() {
    const container = document.getElementById("insights-details-container");
    if (!container) return;
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div class="bg-surface-container-low border border-outline-variant/30 rounded-xl p-lg space-y-md">
                <h3 class="font-bold text-title-md text-on-background flex items-center space-x-sm">
                    <span class="material-symbols-outlined text-primary">groups</span>
                    <span>Audience Age Split</span>
                </h3>
                <div class="space-y-sm">
                    <div>
                        <div class="flex justify-between text-body-sm font-medium text-on-background mb-xs">
                            <span>18-24 Years</span>
                            <span>35%</span>
                        </div>
                        <div class="w-full bg-surface-container rounded-full h-2">
                            <div class="bg-primary h-2 rounded-full" style="width: 35%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-body-sm font-medium text-on-background mb-xs">
                            <span>25-34 Years (Core)</span>
                            <span>48%</span>
                        </div>
                        <div class="w-full bg-surface-container rounded-full h-2">
                            <div class="bg-secondary h-2 rounded-full" style="width: 48%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-body-sm font-medium text-on-background mb-xs">
                            <span>35-44 Years</span>
                            <span>17%</span>
                        </div>
                        <div class="w-full bg-surface-container rounded-full h-2">
                            <div class="bg-outline h-2 rounded-full" style="width: 17%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-surface-container-low border border-outline-variant/30 rounded-xl p-lg space-y-md">
                <h3 class="font-bold text-title-md text-on-background flex items-center space-x-sm">
                    <span class="material-symbols-outlined text-secondary">devices</span>
                    <span>Device Distribution</span>
                </h3>
                <div class="flex items-center justify-around h-32">
                    <div class="text-center">
                        <span class="material-symbols-outlined text-3xl text-outline">phone_iphone</span>
                        <span class="font-bold text-body-md block mt-xs text-on-background">78%</span>
                        <span class="text-label-md text-outline">Mobile</span>
                    </div>
                    <div class="text-center">
                        <span class="material-symbols-outlined text-3xl text-outline">desktop_mac</span>
                        <span class="font-bold text-body-md block mt-xs text-on-background">18%</span>
                        <span class="text-label-md text-outline">Desktop</span>
                    </div>
                    <div class="text-center">
                        <span class="material-symbols-outlined text-3xl text-outline">tablet_mac</span>
                        <span class="font-bold text-body-md block mt-xs text-on-background">4%</span>
                        <span class="text-label-md text-outline">Tablet</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Live Fluctuation Simulation to make the graphs feel live
function startRealtimeAnalytics() {
    setInterval(() => {
        if (!AdState.user.isLoggedIn) return;
        
        // Slightly random fluctuations in impressions and conversions
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
        
        // Re-render KPI updates on the fly
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
            loginBtn.innerHTML = `<span class="inline-block animate-pulse mr-xs">⚡</span> ${message}`;
        }
        if (signupBtn) {
            signupBtn.disabled = true;
            signupBtn.innerHTML = `<span class="inline-block animate-pulse mr-xs">⚡</span> ${message}`;
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
