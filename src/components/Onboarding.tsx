import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { 
  User, 
  Building2, 
  UserCircle, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Phone,
  Calendar,
  Globe,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Lock,
  Camera,
  LogOut,
  Sparkles,
  Mail
} from 'lucide-react';
import CountrySelector from './CountrySelector';
import { signOut } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface OnboardingProps {
  user: any;
  onboardingStatus?: string;
  onComplete: () => void;
}

const STEPS = [
  "Account Type",
  "Personal Info",
  "Address",
  "Identity",
  "Business Info",
  "Business Activity",
  "Financial",
  "Compliance",
  "Tax",
  "Security",
  "Review"
];

const Onboarding: React.FC<OnboardingProps> = ({ user, onboardingStatus, onComplete }) => {
  const [step, setStep] = useState(onboardingStatus === 'under_review' ? 12 : 1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    accountType: '',
    firstName: user.displayName?.split(' ')[0] || '',
    lastName: user.displayName?.split(' ')[1] || '',
    email: user.email || '',
    emailConfirm: user.email || '',
    phone: '',
    dob: '',
    nationality: '',
    country: 'United States',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States'
    },
    kyc: {
      idType: 'Passport',
      idNumber: '',
      expiryDate: '',
      countryOfIssue: 'United States'
    },
    business: {
      name: '',
      type: 'LLC',
      regNumber: '',
      taxId: '',
      address: '',
      website: ''
    },
    activity: {
      productDescription: '',
      industry: '',
      customerLocations: [],
      monthlyVolume: '',
      avgTransaction: '',
      chargeTime: 'Before delivery',
      refunds: 'No'
    },
    financial: {
      holderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      currency: 'USD',
      payoutSchedule: 'Daily'
    },
    compliance: {
      actingForOthers: '',
      pep: '',
      financialCrimes: '',
      restrictedProducts: ''
    },
    tax: {
      taxResidence: 'United States',
      tin: ''
    },
    security: {
      twoFactorEnabled: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (section: string, data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  
  const generateStepFeedback = async (currentStep: number, data: any) => {
    try {
      const stepName = STEPS[currentStep - 1];
      let context = "";
      
      switch(currentStep) {
        case 1: context = `Account Type selected: ${data.accountType}`; break;
        case 2: context = `User's name is ${data.firstName} ${data.lastName}, born on ${data.dob}, nationality ${data.nationality}`; break;
        case 3: context = `Living at ${data.address.street}, ${data.address.city}, ${data.address.country}`; break;
        case 4: context = `ID Type: ${data.kyc.idType}, Number: ${data.kyc.idNumber}`; break;
        case 5: context = `Business name: ${data.business.name}, Type: ${data.business.type}`; break;
        case 6: context = `Industry: ${data.activity.industry}, Volume: ${data.activity.monthlyVolume}, Description: ${data.activity.productDescription}`; break;
        case 7: context = `Bank: ${data.financial.bankName}, Payout: ${data.financial.payoutSchedule}`; break;
        case 8: context = `Compliance answers - Acting for others: ${data.compliance.actingForOthers}, PEP: ${data.compliance.pep}, Financial Crimes: ${data.compliance.financialCrimes}, Restricted Products: ${data.compliance.restrictedProducts}`; break;
        case 9: context = `Tax Residence: ${data.tax.taxResidence}`; break;
        case 10: context = `2FA Enabled: ${data.security.twoFactorEnabled ? 'Yes' : 'No'}`; break;
        case 11: context = "User has reviewed all information and is ready to submit."; break;
        default: context = "Moving forward in the application";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a friendly human colleague at HireCode helping a new user set up their account. The user just completed the '${stepName}' step.
        Context: ${context}.
        
        Write a brief (max 15 words) response that:
        1. Acknowledges a specific detail they just shared in a natural, conversational way.
        2. Sounds like a real person, not a bot. Avoid formal 'concierge' language.
        3. Is encouraging and warm.
        4. Does NOT use emojis.
        5. Avoids generic phrases like 'Great progress' or 'Excellent' if possible.
        
        Example for name: 'Nice to meet you, ${data.firstName}. I have added your personal details to the file.'
        Example for bank: 'Chase is a solid choice. We will make sure your payouts are always on time.'
        Example for 2FA: 'Smart move enabling 2FA. Security is our top priority here.'`,
      });

      return response.text.trim();
    } catch (error) {
      console.error("Feedback generation error:", error);
      return "That looks perfect. Let's move on to the next section.";
    }
  };

  const validateStep = (currentStep: number): string | null => {
    switch (currentStep) {
      case 1:
        if (!formData.accountType) return "Please select an account type.";
        break;
      case 2:
        if (!formData.firstName || !formData.lastName) return "Please enter your full legal name.";
        if (!formData.email) return "Email address is required.";
        if (formData.email !== formData.emailConfirm) return "Email addresses do not match.";
        if (!formData.phone) return "A phone number is required for security.";
        if (!formData.dob) return "Please provide your date of birth.";
        if (!formData.nationality) return "Nationality is required for compliance.";
        break;
      case 3:
        if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zip || !formData.address.country) return "Please provide your full address.";
        break;
      case 4:
        if (!formData.kyc.idNumber) return "Please enter your ID number.";
        break;
      case 5:
        if (!formData.business.name) return "Business name is required.";
        if (!formData.business.regNumber) return "Registration number is required.";
        break;
      case 6:
        if (!formData.activity.productDescription) return "Please describe your products or services.";
        if (!formData.activity.industry) return "Please select your industry.";
        break;
      case 7:
        if (!formData.financial.bankName) return "Bank name is required.";
        if (!formData.financial.accountNumber) return "Account number is required.";
        break;
      case 8:
        if (!formData.compliance.actingForOthers || !formData.compliance.pep || !formData.compliance.financialCrimes || !formData.compliance.restrictedProducts) {
          return "Please answer all compliance questions.";
        }
        break;
      case 9:
        if (!formData.tax.tin) return "Tax Identification Number is required.";
        break;
      case 11:
        const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox && !checkbox.checked) return "You must confirm the accuracy of your information.";
        break;
    }
    return null;
  };

  const nextStep = async () => {
    setValidationError(null);
    const error = validateStep(step);
    if (error) {
      setValidationError(error);
      return;
    }

    if (step >= STEPS.length) {
      setStep(s => s + 1);
      return;
    }

    setIsGeneratingFeedback(true);
    const feedbackText = await generateStepFeedback(step, formData);
    setFeedback(feedbackText);
    setIsGeneratingFeedback(false);
  };

  const proceedAfterFeedback = () => {
    setFeedback(null);
    setStep(s => Math.min(s + 1, STEPS.length + 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        onboardingStatus: 'under_review',
        onboardingData: formData,
        updatedAt: new Date().toISOString()
      });
      nextStep();
    } catch (error) {
      console.error('Error submitting onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Choose your account type</h2>
              <p className="text-c-muted">Select the option that best describes your needs.</p>
            </div>
            <div className="grid gap-4">
              {[
                { id: 'individual', title: 'Individual', desc: 'For personal use and simple payments', icon: <UserCircle className="w-6 h-6" /> },
                { id: 'freelancer', title: 'Freelancer / Sole Proprietor', desc: 'For independent professionals and creators', icon: <Briefcase className="w-6 h-6" /> },
                { id: 'business', title: 'Registered Business', desc: 'For LLCs, Corporations, and established companies', icon: <Building2 className="w-6 h-6" /> }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={async () => {
                    setFormData({ ...formData, accountType: type.id });
                    await nextStep();
                  }}
                  className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group ${
                    formData.accountType === type.id 
                      ? 'border-c-violet bg-c-violet/10' 
                      : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    formData.accountType === type.id ? 'bg-c-violet text-white' : 'bg-white/5 text-c-dim group-hover:text-c-violet'
                  }`}>
                    {type.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{type.title}</h4>
                    <p className="text-sm text-c-muted">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Personal Information</h2>
              <p className="text-c-muted">Please provide your legal details for verification.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="Legal first name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="Legal last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-dim" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Confirm Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-dim" />
                  <input 
                    type="email" 
                    value={formData.emailConfirm}
                    onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                    placeholder="Confirm your email"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-dim" />
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-dim" />
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <CountrySelector 
                  label="Nationality"
                  required
                  value={formData.nationality}
                  onChange={(val) => setFormData({ ...formData, nationality: val })}
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Home Address</h2>
              <p className="text-c-muted">Where are you currently located?</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.address.street}
                onChange={(e) => updateFormData('address', { street: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.address.city}
                  onChange={(e) => updateFormData('address', { city: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="San Francisco"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  State / Province <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.address.state}
                  onChange={(e) => updateFormData('address', { state: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="CA"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.address.zip}
                  onChange={(e) => updateFormData('address', { zip: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="94103"
                />
              </div>
              <div className="space-y-2">
                <CountrySelector 
                  label="Country"
                  required
                  value={formData.address.country}
                  onChange={(val) => updateFormData('address', { country: val })}
                />
              </div>
            </div>
            <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
              <FileText className="w-8 h-8 text-c-dim mx-auto mb-2" />
              <p className="text-sm text-white font-bold">Upload Proof of Address</p>
              <p className="text-xs text-c-muted">Utility bill or bank statement (PDF/JPG)</p>
              <button className="mt-4 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-all">
                Select File
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Identity Verification</h2>
              <p className="text-c-muted">We need to verify your government ID.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest">ID Type</label>
              <select 
                value={formData.kyc.idType}
                onChange={(e) => updateFormData('kyc', { idType: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
              >
                <option value="Passport">Passport</option>
                <option value="National ID">National ID</option>
                <option value="Driver's License">Driver's License</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.kyc.idNumber}
                onChange={(e) => updateFormData('kyc', { idNumber: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                placeholder="Enter ID number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                <Camera className="w-8 h-8 text-c-dim mx-auto mb-2" />
                <p className="text-xs text-white font-bold">Front of ID</p>
                <button className="mt-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white">Upload</button>
              </div>
              <div className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                <UserCircle className="w-8 h-8 text-c-dim mx-auto mb-2" />
                <p className="text-xs text-white font-bold">Selfie Scan</p>
                <button className="mt-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white">Capture</button>
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Business Information</h2>
              <p className="text-c-muted">Tell us about your company.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Legal Business Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.business.name}
                onChange={(e) => updateFormData('business', { name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                placeholder="HireCode Inc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Entity Type <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.business.type}
                  onChange={(e) => updateFormData('business', { type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                >
                  <option value="Sole Proprietor">Sole Proprietor</option>
                  <option value="LLC">LLC</option>
                  <option value="Corporation">Corporation</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.business.regNumber}
                  onChange={(e) => updateFormData('business', { regNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="12345678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Website or Social URL <span className="text-c-dim font-normal text-[10px] ml-1">(Optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-dim" />
                <input 
                  type="url" 
                  value={formData.business.website}
                  onChange={(e) => updateFormData('business', { website: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="https://yourbusiness.com"
                />
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Business Activity</h2>
              <p className="text-c-muted">Help us understand your risk profile.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                What do you sell? <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={formData.activity.productDescription}
                onChange={(e) => updateFormData('activity', { productDescription: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all h-24 resize-none"
                placeholder="Briefly describe your products or services..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Industry <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.activity.industry}
                  onChange={(e) => updateFormData('activity', { industry: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                >
                  <option value="">Select industry</option>
                  <option value="Software">Software / SaaS</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Education">Education</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                  Monthly Volume <span className="text-red-500">*</span>
                </label>
                <select 
                  value={formData.activity.monthlyVolume}
                  onChange={(e) => updateFormData('activity', { monthlyVolume: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                >
                  <option value="$0 - $1k">$0 - $1k</option>
                  <option value="$1k - $10k">$1k - $10k</option>
                  <option value="$10k - $100k">$10k - $100k</option>
                  <option value="$100k+">$100k+</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Financial Setup</h2>
              <p className="text-c-muted">Where should we send your payouts?</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.financial.bankName}
                onChange={(e) => updateFormData('financial', { bankName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                placeholder="Chase, Wells Fargo, etc."
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Account Number / IBAN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-muted" />
                <input 
                  type="text" 
                  value={formData.financial.accountNumber}
                  onChange={(e) => updateFormData('financial', { accountNumber: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="Enter account number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest">Payout Schedule</label>
                <select 
                  value={formData.financial.payoutSchedule}
                  onChange={(e) => updateFormData('financial', { payoutSchedule: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-c-dim uppercase tracking-widest">Currency</label>
                <select 
                  value={formData.financial.currency}
                  onChange={(e) => updateFormData('financial', { currency: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Compliance & Legal</h2>
              <p className="text-c-muted">Please answer these required questions.</p>
            </div>
            <div className="space-y-4">
              {[
                { id: 'actingForOthers', label: 'Are you acting on behalf of someone else?' },
                { id: 'pep', label: 'Are you a politically exposed person (PEP)?' },
                { id: 'financialCrimes', label: 'Have you been involved in financial crimes?' },
                { id: 'restrictedProducts', label: 'Will you process payments for restricted products?' }
              ].map((q) => (
                <div key={q.id} className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-2xl">
                  <span className="text-sm text-white font-bold flex items-center gap-1">
                    {q.label} <span className="text-red-500">*</span>
                  </span>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateFormData('compliance', { [q.id]: opt })}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          formData.compliance[q.id] === opt 
                            ? 'bg-c-violet text-white' 
                            : 'bg-white/5 text-c-muted hover:bg-white/10'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Tax Information</h2>
              <p className="text-c-muted">Required for regulatory reporting.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Country of Tax Residence <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.tax.taxResidence}
                onChange={(e) => updateFormData('tax', { taxResidence: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-c-violet outline-hidden transition-all"
                placeholder="United States"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-c-dim uppercase tracking-widest flex items-center gap-1">
                Tax Identification Number (TIN/SSN) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-c-dim" />
                <input 
                  type="password" 
                  value={formData.tax.tin}
                  onChange={(e) => updateFormData('tax', { tin: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-c-violet outline-hidden transition-all"
                  placeholder="Enter TIN"
                />
              </div>
            </div>
            <div className="p-4 bg-c-violet/10 border border-c-violet/20 rounded-2xl flex gap-4">
              <AlertCircle className="w-6 h-6 text-c-violet shrink-0" />
              <p className="text-xs text-c-muted leading-relaxed">
                We'll generate the appropriate tax forms (W-8BEN/W-9) based on your information. You'll be able to review them in the next step.
              </p>
            </div>
          </motion.div>
        );

      case 10:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Security Setup</h2>
              <p className="text-c-muted">Protect your account with 2FA.</p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center">
              <ShieldCheck className="w-16 h-16 text-c-teal mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                Enable Two-Factor Authentication
                <span className="text-c-dim font-normal text-[10px]">(Optional)</span>
              </h3>
              <p className="text-sm text-c-muted mb-8">Add an extra layer of security to your account using an authenticator app or SMS.</p>
              <button 
                onClick={() => updateFormData('security', { twoFactorEnabled: !formData.security.twoFactorEnabled })}
                className={`w-full py-4 rounded-2xl font-black transition-all ${
                  formData.security.twoFactorEnabled 
                    ? 'bg-c-teal text-white' 
                    : 'bg-c-violet text-white hover:bg-c-indigo hover:shadow-lg hover:shadow-c-violet/20'
                }`}
              >
                {formData.security.twoFactorEnabled ? '2FA Enabled ✓' : 'Enable 2FA Now'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest mb-1">Backup Codes</p>
                <p className="text-xs text-white font-bold">Generate</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest mb-1">Authenticator</p>
                <p className="text-xs text-white font-bold">Setup App</p>
              </div>
            </div>
          </motion.div>
        );

      case 11:
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Review & Confirm</h2>
              <p className="text-c-muted">Please verify your information before submitting.</p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { label: 'Account Type', value: formData.accountType },
                { label: 'Name', value: `${formData.firstName} ${formData.lastName}` },
                { label: 'Phone', value: formData.phone },
                { label: 'Address', value: `${formData.address.street}, ${formData.address.city}` },
                { label: 'Business', value: formData.business.name || 'N/A' },
                { label: 'Bank', value: formData.financial.bankName }
              ].map((item, i) => (
                <div key={i} className="flex justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="text-xs font-bold text-c-dim uppercase tracking-widest">{item.label}</span>
                  <span className="text-sm text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <input type="checkbox" className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-c-violet focus:ring-c-violet" required />
              <p className="text-xs text-c-muted leading-relaxed">
                I confirm that all information provided is accurate and complete to the best of my knowledge. I understand that providing false information may result in account termination. <span className="text-red-500">*</span>
              </p>
            </div>
          </motion.div>
        );

      case 12:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-24 h-24 bg-c-teal/10 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle2 className="w-12 h-12 text-c-teal" />
            </motion.div>
            <h2 className="text-4xl font-black text-white mb-4">Application Submitted</h2>
            <p className="text-lg text-c-muted mb-12 max-w-md mx-auto">
              Your account is now under review. Our compliance team will verify your details within 24-48 hours.
            </p>
            <button 
              onClick={onComplete}
              className="px-12 py-4 bg-c-violet text-white rounded-2xl font-black hover:bg-c-indigo hover:shadow-2xl hover:shadow-c-violet/20 transition-all"
            >
              Go to Dashboard
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-c-bg flex items-center justify-center p-6 relative">
      <button 
        onClick={() => signOut(auth)}
        className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-c-bg/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="max-w-md w-full bg-c-surface border border-white/10 p-8 rounded-[2.5rem] shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-c-violet/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-c-violet" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 leading-tight">
                {feedback}
              </h3>
              <button
                onClick={proceedAfterFeedback}
                className="w-full py-4 bg-c-violet text-white font-black rounded-2xl hover:bg-c-indigo transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl w-full">
        {step <= STEPS.length && (
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest mb-1">Step {step} of {STEPS.length}</p>
                <h3 className="text-xl font-bold text-white">{STEPS[step - 1]}</h3>
              </div>
              <p className="text-sm font-bold text-c-violet">{Math.round((step / STEPS.length) * 100)}% Complete</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / STEPS.length) * 100}%` }}
                className="h-full bg-c-violet"
              />
            </div>
          </div>
        )}

        <div className="bg-c-surface border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-c-violet/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {validationError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold"
            >
              <AlertCircle className="w-5 h-5" />
              {validationError}
            </motion.div>
          )}

          {step <= STEPS.length && (
            <div className="mt-12 flex justify-between gap-4">
              {step > 1 && (
                <button 
                  onClick={prevStep}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-white/5 hover:bg-white/10 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button 
                onClick={step === STEPS.length ? handleSubmit : nextStep}
                disabled={isSubmitting || isGeneratingFeedback}
                className={`flex items-center gap-2 px-12 py-4 rounded-2xl font-black text-white transition-all ml-auto ${
                  (isSubmitting || isGeneratingFeedback) ? 'bg-c-violet/50 cursor-not-allowed' : 'bg-c-violet hover:bg-c-indigo hover:shadow-xl hover:shadow-c-violet/20'
                }`}
              >
                {isSubmitting ? 'Submitting...' : isGeneratingFeedback ? 'Processing...' : step === STEPS.length ? 'Submit Application' : 'Continue'}
                {(!isSubmitting && !isGeneratingFeedback) && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {step <= STEPS.length && (
          <p className="text-center mt-8 text-xs text-c-dim">
            Your data is encrypted and stored securely. <br />
            By continuing, you agree to our <span className="text-white font-bold underline cursor-pointer">Terms of Service</span> and <span className="text-white font-bold underline cursor-pointer">Privacy Policy</span>.
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
