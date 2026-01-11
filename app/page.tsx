"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Car, Wrench, MapPin, Shield, CheckCircle2, ChevronRight, User, Truck, Phone } from "lucide-react"

// Screen State types
type Screen = "WELCOME" | "SELECTION"

interface LandingSection {
    id: number
    type: string
    title: string
    content: string
    image_url: string
    video_url: string
    order_index: number
    style_config: any
}

export default function Home() {
    const [currentScreen, setCurrentScreen] = useState<Screen>("WELCOME")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const { toast } = useToast()

    // Dynamic Data
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [sections, setSections] = useState<LandingSection[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Contact Form State
    const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [setRes, secRes] = await Promise.all([
                    fetch("/api/settings/landing", { cache: "no-store" }),
                    fetch("/api/settings/landing/sections", { cache: "no-store" })
                ])
                if (setRes.ok) {
                    const s = await setRes.json()
                    setSettings(s)
                    // Apply theme colors
                    if (s.theme_primary) document.documentElement.style.setProperty('--primary', s.theme_primary)
                    // We can also use inline styles for specific elements
                }
                if (secRes.ok) setSections(await secRes.json())
            } catch (e) {
                console.error("Failed to load landing data")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const handleGetStarted = () => {
        if (termsAccepted) {
            setCurrentScreen("SELECTION")
        }
    }

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contactForm)
            })
            if (res.ok) {
                toast({ title: "Message Sent", description: "We'll get back to you shortly." })
                setContactForm({ name: "", email: "", subject: "", message: "" })
            } else throw new Error("Failed")
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Dynamic Renderers
    const renderSection = (section: LandingSection) => {
        switch (section.type) {
            case 'hero': // Custom Hero Section override
            case 'banner':
                return (
                    <section key={section.id} className="py-20 relative overflow-hidden text-white" style={{ backgroundColor: settings.theme_primary || '#2563eb' }}>
                        {section.video_url ? (
                            <video src={section.video_url} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"></video>
                        ) : (
                            section.image_url && <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${section.image_url})` }}></div>
                        )}
                        <div className="container mx-auto px-4 relative z-10 text-center">
                            <h2 className="text-4xl font-bold mb-4">{section.title}</h2>
                            <p className="text-xl max-w-2xl mx-auto mb-8 whitespace-pre-line">{section.content}</p>
                            {/* If it's a banner with video but we want to show it inline instead of bg? Usually banner implies BG. 
                                Let's check if it's NOT banner type but has video url? 
                                Actually, if type is 'text_image' and has video, we might want to replace image with video.
                            */}
                        </div>
                    </section>
                )
            case 'text_image':
                return (
                    <section key={section.id} className="py-20 bg-white">
                        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <h2 className="text-3xl font-bold mb-4 text-gray-900">{section.title}</h2>
                                <div className="prose text-gray-600 whitespace-pre-line leading-relaxed">{section.content}</div>
                            </div>
                            <div className="order-1 md:order-2">
                                {section.video_url ? (
                                    <div className="rounded-xl shadow-lg w-full h-[400px] bg-black overflow-hidden relative">
                                        <video src={section.video_url} controls className="w-full h-full object-cover" />
                                    </div>
                                ) : section.image_url ? (
                                    <img src={section.image_url} alt={section.title} className="rounded-xl shadow-lg w-full object-cover h-[400px]" />
                                ) : (
                                    <div className="bg-gray-100 rounded-xl h-[300px] flex items-center justify-center text-gray-400">No Media</div>
                                )}
                            </div>
                        </div>
                    </section>
                )
            case 'features':
                return (
                    <section key={section.id} className="py-20 bg-gray-50">
                        <div className="container mx-auto px-4 text-center">
                            <h2 className="text-3xl font-bold mb-12">{section.title}</h2>
                            {/* Mock Feature Grid if no structured content parser yet */}
                            <div className="grid md:grid-cols-3 gap-8 text-left">
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <Shield className="h-8 w-8 text-blue-600 mb-4" />
                                    <h3 className="font-bold mb-2">Verified Reliability</h3>
                                    <p className="text-gray-600">{section.content || "Trust our vetted network."}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <MapPin className="h-8 w-8 text-blue-600 mb-4" />
                                    <h3 className="font-bold mb-2">Fast Response</h3>
                                    <p className="text-gray-600">We find the nearest help instantly.</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm">
                                    <Phone className="h-8 w-8 text-blue-600 mb-4" />
                                    <h3 className="font-bold mb-2">24/7 Support</h3>
                                    <p className="text-gray-600">Always here when you need us.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )
            default: return null
        }
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

    // Primary Color Style
    const primaryColor = settings.theme_primary || "#2563eb"
    const secondaryColor = settings.theme_secondary || "#9333ea"

    return (
        <main className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: settings.theme_background || '#ffffff' }}>
            {/* SCREEN 1: WELCOME HERO */}
            {currentScreen === "WELCOME" && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                    {/* Background Video or Gradient */}
                    {settings.hero_video_background ? (
                        <video
                            src={settings.hero_video_background}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute top-0 left-0 w-full h-full object-cover -z-20 opacity-90"
                        />
                    ) : (
                        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-10 bg-gradient-to-br from-blue-500 to-purple-500"></div>
                    )}

                    {/* Overlay for Video Readability */}
                    {settings.hero_video_background && <div className="absolute inset-0 bg-white/40 -z-10 backdrop-blur-sm"></div>}

                    {/* Logo Area */}
                    <div className="mb-8 animate-in fade-in zoom-in duration-500">
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-16 w-16 rounded-xl overflow-hidden shadow-lg bg-white p-1">
                                <img src="/vehix-logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            </div>
                            <span className="text-4xl font-extrabold tracking-tighter text-gray-900 drop-shadow-sm">Vehix</span>
                        </div>
                    </div>

                    {/* Hero Animation (Dynamic) */}
                    <div className="mb-8 w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-4 animate-in slide-in-from-bottom-5 duration-700 delay-100">
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                            {settings.hero_image_url ? (
                                <img src={settings.hero_image_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Car className="h-16 w-16 text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-400">Configure Animation in Admin</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight animate-in slide-in-from-bottom-5 duration-700 delay-200 drop-shadow-sm">
                        {settings.hero_title || "Get Back on Road Fast"}
                    </h1>

                    <p className="text-lg text-gray-800 font-medium mb-8 max-w-lg animate-in slide-in-from-bottom-5 duration-700 delay-300 drop-shadow-sm">
                        {settings.hero_subtitle || "Your reliable partner for roadside assistance."}
                    </p>

                    <div className="flex items-center space-x-2 mb-8 animate-in slide-in-from-bottom-5 duration-700 delay-400 bg-white/60 p-2 rounded-full backdrop-blur">
                        <Checkbox
                            id="terms"
                            checked={termsAccepted}
                            onCheckedChange={(c) => setTermsAccepted(!!c)}
                            style={{ borderColor: primaryColor }}
                        />
                        <label htmlFor="terms" className="text-sm font-medium text-gray-800 cursor-pointer">
                            By Continuing, you agree to our Terms.
                        </label>
                    </div>

                    <div className="animate-in slide-in-from-bottom-5 duration-700 delay-500">
                        <Button
                            size="lg"
                            onClick={handleGetStarted}
                            disabled={!termsAccepted}
                            style={{ backgroundColor: termsAccepted ? primaryColor : undefined }}
                            className={`text-lg px-8 py-6 rounded-full font-bold shadow-lg transition-all duration-300 ${!termsAccepted && 'bg-gray-200 text-gray-400'}`}
                        >
                            Get Started! <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* SCREEN 2: DYNAMIC CONTENT */}
            {currentScreen === "SELECTION" && (
                <div className="flex-1 animate-in fade-in duration-500">
                    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
                        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                            <div className="font-bold text-xl flex items-center gap-2">
                                <img src="/vehix-logo.jpg" className="h-8 w-8 rounded" />
                                Vehix
                            </div>
                            <div className="flex gap-4">
                                {/* Sign In button removed as requested */}
                            </div>
                        </div>
                    </nav>

                    {/* Default Selection Block */}
                    <section className="py-20 px-4 text-center bg-gray-50">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-4xl font-bold mb-12">Choose Your Role</h2>
                            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">

                                <Link href={settings.rider_link || "/admin/riders/add?role=rider"} className="group">
                                    <div className="h-full bg-white p-8 rounded-2xl shadow-lg border hover:border-blue-500 transition-all overflow-hidden relative">
                                        {settings.rider_image ? (
                                            <div className="absolute inset-0 z-0">
                                                <img src={settings.rider_image} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                                            </div>
                                        ) : null}

                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="bg-blue-100 p-4 rounded-full mb-6 w-fit mx-auto"><Car className="h-10 w-10 text-blue-600" /></div>
                                            <h3 className="text-2xl font-bold mb-2">Request Help</h3>
                                            <p className="text-gray-500 mb-6">Join as Rider if you own a vehicle and want peace of mind.</p>
                                            <Button className="w-full mt-4 bg-blue-600">Join as Rider</Button>
                                        </div>
                                    </div>
                                </Link>

                                <Link href={settings.roadie_link || "/admin/roadies/add?role=roadie"} className="group">
                                    <div className="h-full bg-white p-8 rounded-2xl shadow-lg border hover:border-green-500 transition-all overflow-hidden relative">
                                        {settings.roadie_image ? (
                                            <div className="absolute inset-0 z-0">
                                                <img src={settings.roadie_image} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                                            </div>
                                        ) : null}

                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="bg-green-100 p-4 rounded-full mb-6 w-fit mx-auto"><Wrench className="h-10 w-10 text-green-600" /></div>
                                            <h3 className="text-2xl font-bold mb-2">Provide Help</h3>
                                            <p className="text-gray-500 mb-6">Join as Roadie to earn money by helping stranded drivers.</p>
                                            <Button className="w-full mt-4 bg-green-600">Join as Roadie</Button>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* DYNAMIC SECTIONS */}
                    {sections.map(section => renderSection(section))}


                    {/* CONTACT */}
                    <section className="py-20 bg-white border-t">
                        <div className="container mx-auto px-4 max-w-lg">
                            <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
                            <form onSubmit={handleContactSubmit} className="space-y-4">
                                <Input placeholder="Name" required value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
                                <Input type="email" placeholder="Email" required value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
                                <Input placeholder="Subject" value={contactForm.subject} onChange={e => setContactForm({ ...contactForm, subject: e.target.value })} />
                                <Textarea placeholder="Message" required value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} />
                                <Button type="submit" className="w-full" disabled={isSubmitting} style={{ backgroundColor: primaryColor }}>
                                    {isSubmitting ? "Sending..." : "Send Message"}
                                </Button>
                            </form>
                        </div>
                    </section>
                </div>
            )}
        </main>
    )
}
