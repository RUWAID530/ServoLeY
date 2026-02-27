// Last updated: 2024-01-24T12:00:00.000Z
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Store, CloudUpload, ChevronDown, CheckCircle, ArrowLeft, ArrowRight, Check } from './icons';
import { OnboardingData, getInitialData } from '../types/Index';
import FormHeader from './FormHeader';
import { API_BASE } from '../App';

// Hash password function
const hashPassword = async (password: string): Promise<string> => {
  // This is a simple implementation - in production, you should use a proper
  // password hashing library like bcrypt on the server side
  // For now, we'll just return the password as is since the backend will handle hashing
  return password;
};





interface PortfolioPhoto { 
  preview: string;
  file: File;
}
interface StepProps {
  data: OnboardingData;
  updateData: (fields: Partial<OnboardingData>) => void;
}



// --- Step 1: Personal Information ---
export const StepPersonal: React.FC<StepProps> = ({ data, updateData }) => {
    
    
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      updateData({ 
        profilePhoto: file,
        profilePhotoName: file.name,
        profilePhotoType: file.type
      });
    }
  };




  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Full name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="Enter your full legal name"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
          />
          <p className="text-xs text-gray-500">As per PAN / Aadhaar</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Email address <span className="text-red-500">*</span></label>
          <input 
            type="email" 
            placeholder="you@example.com"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Mobile number <span className="text-red-500">*</span></label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
              +91
            </span>
            <input 
              type="tel" 
              placeholder="98765 43210"
              className="flex-1 w-full p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={data.phone}
              onChange={(e) => updateData({ phone: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Date of birth <span className="text-red-500">*</span></label>
          <input 
            type="date" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-gray-700"
            value={data.dob}
            onChange={(e) => updateData({ dob: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Profile photo <span className="text-gray-400 font-normal ml-1">Optional</span></label>
        <div 
          onClick={handleFileClick}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative"
        >
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             className="hidden" 
             accept="image/png, image/jpeg, image/jpg"
           />
           {data.profilePhoto ? (
               <div className="flex flex-col items-center">
                   <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2 overflow-hidden">
                    <img src={data.profilePhoto instanceof File ? URL.createObjectURL(data.profilePhoto) : ""} alt="Preview" className="w-full h-full object-cover" />   
                   </div>
                   <p className="text-sm font-medium text-indigo-600 truncate max-w-[200px]">{data.profilePhotoName || "Profile photo"}</p>
                   <p className="text-xs text-green-600 mt-1">Photo selected</p>
               </div>
           ) : (
               <>
                <CloudUpload className="w-8 h-8 text-indigo-500 mb-2" />
                <p className="text-sm font-medium text-gray-700">Tap to upload a clear photo</p>
                <p className="text-xs text-gray-500 mt-1">Square image, face clearly visible. Max 5 MB.</p>
                <button type="button" className="mt-3 text-sm text-indigo-600 font-medium hover:underline pointer-events-none">Browse gallery</button>
               </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">PAN number</label>
            <div className="relative">
                <input 
                type="text" 
                placeholder="ABCDE1234F"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                value={data.panNumber}
                onChange={(e) => updateData({ panNumber: e.target.value })}
                />
                {data.panNumber && data.panNumber.length === 10 && <span className="absolute right-3 top-3.5 text-xs text-green-600 font-bold">Verified</span>}
            </div>
        </div>
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Aadhaar number</label>
            <input 
            type="text" 
            placeholder="XXXX-XXXX-XXXX"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={data.aadhaarNumber}
            onChange={(e) => updateData({ aadhaarNumber: e.target.value })}
            />
        </div>
      </div>
    </div>
  );
};

// --- Step 2: Provider Type ---
export const StepType: React.FC<StepProps> = ({ data, updateData }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-base font-medium text-gray-900">Provider type <span className="text-red-500">*</span></h3>
        <p className="text-sm text-gray-500">You can update this later, but it may change the fields we ask for.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => updateData({ providerType: 'freelancer' })}
          className={`p-6 rounded-xl border-2 text-left transition-all relative ${data.providerType === 'freelancer' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mb-4">
               <User className="w-6 h-6" />
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${data.providerType === 'freelancer' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                {data.providerType === 'freelancer' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
          </div>
          <h4 className="font-semibold text-gray-900">Individual freelancer</h4>
          <p className="text-sm text-gray-500 mt-1">You work on your own, under your personal name.</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
             <span className="w-2 h-2 rounded-full bg-green-500"></span> Fastest setup
          </div>
        </button>

        <button 
          onClick={() => updateData({ providerType: 'shop' })}
          className={`p-6 rounded-xl border-2 text-left transition-all relative ${data.providerType === 'shop' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
        >
          <div className="flex items-start justify-between">
             <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
               <Store className="w-6 h-6" />
             </div>
             <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${data.providerType === 'shop' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}>
                {data.providerType === 'shop' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
          </div>
          <h4 className="font-semibold text-gray-900">Local shop / store</h4>
          <p className="text-sm text-gray-500 mt-1">You operate from a physical business location.</p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
             <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">Supports team members</span>
          </div>
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <label className="text-sm font-medium text-gray-700 mb-2 block">What do you primarily offer?</label>
        <div className="relative">
          <select className="w-full p-3 bg-white border border-gray-300 text-gray-700 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
             <option>e.g., Electrician, Beautician, AC repair, Pet services</option>
          </select>
          <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

// --- Step 3: Location ---
export const StepLocation: React.FC<StepProps> = ({ data, updateData }) => {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Home address <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="Flat / house no., street, area"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
          />
          <p className="text-xs text-gray-500">Use an address where you can reliably receive bookings and messages.</p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
            <div className="relative">
                <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                    value={data.city}
                    onChange={(e) => updateData({ city: e.target.value })}
                >
                    <option value="">Select city</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-4 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">PIN / ZIP code <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="Enter PIN / ZIP"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={data.zip}
              onChange={(e) => updateData({ zip: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
                 <label className="text-sm font-medium text-gray-700">Service radius <span className="text-red-500">*</span></label>
                 <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Up to {data.radius} km</span>
            </div>
            
            <input 
                type="range" 
                min="1" 
                max="50" 
                value={data.radius} 
                onChange={(e) => updateData({ radius: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
             <div className="flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>50 km</span>
            </div>
        </div>

        <div className="bg-gray-100 rounded-xl h-32 flex items-center justify-center border border-gray-200">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-sm text-gray-600 font-medium">Auto-detecting location...</span>
            </div>
        </div>
      </div>
    );
  };

// --- Step 4: Services ---
export const StepServices: React.FC<StepProps> = ({ data, updateData }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newPhotoObjects: PortfolioPhoto[] = newFiles.map(file => ({
                preview: URL.createObjectURL(file),
                file: file
            }));
            updateData({ portfolioPhotos: [...(data.portfolioPhotos || []), ...newPhotoObjects] });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Service category <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <select 
                         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-700 appearance-none"
                         value={data.serviceCategory || ''}
                         onChange={(e) => updateData({ serviceCategory: e.target.value as 'Plumbing' | 'Cleaning' | 'Electrical' | undefined })}
                        >
                            <option value="">Select a main category</option>
                            <option value="Plumbing">Plumbing</option>
                            <option value="Cleaning">Cleaning</option>
                            <option value="Electrical">Electrical</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-4 pointer-events-none" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Years of experience <span className="text-red-500">*</span></label>
                    
                  <input 
                    type="number"
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-700"
                    value={data.yearsExperience}
                    onChange={(e) => updateData({ yearsExperience: e.target.value })}
                    />

                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Specific services you provide</label>
                    <span className="text-xs text-red-500">Select at least one</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['Installation', 'Repair & fixing', 'Maintenance', 'Inspection / audit', 'Consultation', 'Emergency visit'].map(tag => (
                        <button 
                            key={tag}
                            type="button"
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${data.skills?.includes(tag) ? 'bg-indigo-100 border-indigo-200 text-indigo-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            onClick={() => {
                                const currentSkills = data.skills || [];
                                const newSkills = currentSkills.includes(tag) 
                                    ? currentSkills.filter(s => s !== tag) 
                                    : [...currentSkills, tag];

                                updateData({ skills: newSkills });
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Short bio / skill description <span className="text-red-500">*</span></label>
                </div>
                <textarea 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    placeholder="Describe your experience, specialties, tools you use, or any guarantees you offer."
                    value={data.bio}
                    onChange={(e) => updateData({ bio: e.target.value })}
                />
                <div className="text-right text-xs text-gray-400">0 / 400</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 <h4 className="text-sm font-medium text-gray-800 mb-1">Portfolio Photos</h4>
                 <p className="text-xs text-gray-500 mb-3">Strong profiles usually have 3-6 clear, well-lit examples of your work.</p>
                 
                 <div className="flex flex-wrap gap-2 mb-3">
                     {data.portfolioPhotos && data.portfolioPhotos.map((photo: PortfolioPhoto, idx) => (
                         <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                             <img src={photo.preview} alt="preview" className="w-full h-full object-cover" />
                         </div>
                     ))}
                 </div>

                 <div className="flex gap-2">
                     <button 
                        onClick={handleFileClick}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100"
                     >
                         Add portfolio photos
                     </button>
                     <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleFileChange} 
                         className="hidden" 
                         multiple 
                         accept="image/*"
                     />
                 </div>
            </div>
        </div>
    );
};

// --- Step 5: Credentials ---
export const StepCredentials: React.FC<StepProps> = ({ data, updateData }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            updateData({ 
                idProof: file,
                idProofName: file.name,
                idProofType: file.type
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-indigo-900 mb-1">Get verified faster</h4>
                <p className="text-xs text-indigo-700">Clear and complete documents help us verify your account quickly and unlock more visibility on the platform.</p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                     <label className="text-sm font-medium text-gray-700">Primary ID proof (PAN or Aadhaar) <span className="text-red-500">*</span></label>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900 mb-2">Upload a clear photo or PDF of your PAN or Aadhaar</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                         <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">Name must match profile</span>
                         <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">No glare</span>
                    </div>
                    
                    <div 
                        onClick={handleFileClick}
                        className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-white transition-colors cursor-pointer bg-white/50"
                    >
                        <input 
                             type="file" 
                             ref={fileInputRef} 
                             onChange={handleFileChange} 
                             className="hidden" 
                             accept="image/*,application/pdf"
                        />
                        {data.idProof ? (
                             <div className="flex flex-col items-center">
                                 <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                                     <CheckCircle className="w-6 h-6" />
                                 </div>
                                 <span className="text-sm text-gray-900 font-medium">{data.idProofName || "ID document"}</span>
                                 <span className="text-xs text-green-600 mt-1">Ready to upload</span>
                             </div>
                        ) : (
                             <>
                                <CloudUpload className="w-6 h-6 text-gray-400 mb-2" />
                                <span className="text-sm text-indigo-600 font-medium">Click to upload document</span>
                                <span className="text-xs text-gray-400 mt-1">JPG, PNG, PDF (Max 10MB)</span>
                             </>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between">
                     <label className="text-sm font-medium text-gray-700">Skill certificates or training proofs</label>
                     <span className="text-xs text-gray-400">Optional</span>
                </div>
                <button className="w-full py-6 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 text-sm text-gray-600 font-medium">
                     + Add certificate
                </button>
            </div>
        </div>
    );
};

// --- Step 6: Communication ---
export const StepCommunication: React.FC<StepProps> = ({ data, updateData }) => {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Choose how you receive booking updates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">WhatsApp number <span className="text-red-500">*</span></label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            +91
                            </span>
                            <input 
                            type="tel" 
                            className="flex-1 w-full p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={data.whatsapp}
                            onChange={(e) => updateData({ whatsapp: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center mt-2">
                             <input type="checkbox" id="sameAsMobile" className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" defaultChecked />
                             <label htmlFor="sameAsMobile" className="ml-2 text-xs text-gray-600">Same as mobile number provided earlier.</label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                 <label className="text-sm font-medium text-gray-700">Preferred communication method <span className="text-red-500">*</span></label>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     {['Call', 'WhatsApp', 'Email'].map((method) => (
                         <button 
                            key={method}
                            onClick={() => updateData({ preferredMethod: method.toLowerCase() as any })}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${data.preferredMethod === method.toLowerCase() ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                         >
                            {method}
                         </button>
                     ))}
                 </div>
                 <p className="text-xs text-gray-500">We'll still receive critical alerts on more than one channel when needed.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-700">Notification preferences</label>
                <div className="space-y-2">
                    {[
                        'Booking alerts (new bookings, reschedules, cancellations)',
                        'Payment updates (advance received, payout processed)',
                        'Service reminders (upcoming appointments)'
                    ].map((pref, i) => (
                        <div key={i} className="flex items-start">
                             <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" defaultChecked />
                             <span className="ml-2 text-sm text-gray-600">{pref}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Step 7: Pricing & Policies ---
export const StepPricing: React.FC<StepProps> = ({ data, updateData }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Set your base pricing</h3>
                <p className="text-sm text-gray-500">This helps customers understand your starting range. You can adjust final quotes per job.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Minimum visiting charge <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-gray-500">₹</span>
                        <input 
                            type="number" 
                            className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. 299"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Hourly rate (Optional)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-gray-500">₹</span>
                        <input 
                            type="number" 
                            className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. 500"
                            value={data.hourlyRate}
                            onChange={(e) => updateData({ hourlyRate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-4">
                 <h4 className="text-sm font-medium text-gray-900">Cancellation policy</h4>
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                     <div className="flex items-start gap-3">
                         <input type="radio" name="policy" defaultChecked className="mt-1 text-indigo-600 focus:ring-indigo-500" />
                         <div>
                             <span className="block text-sm font-medium text-gray-900">Standard</span>
                             <span className="text-xs text-gray-500">Full refund if cancelled 24h before. 50% thereafter.</span>
                         </div>
                     </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                     <div className="flex items-start gap-3">
                         <input type="radio" name="policy" className="mt-1 text-indigo-600 focus:ring-indigo-500" />
                         <div>
                             <span className="block text-sm font-medium text-gray-900">Flexible</span>
                             <span className="text-xs text-gray-500">Full refund if cancelled up to 2 hours before booking.</span>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

// --- Step 8: Security ---
export const StepSecurity: React.FC<StepProps> = ({ data, updateData }) => {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-base font-medium text-gray-900">Payment methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 border rounded-xl cursor-pointer transition-colors ${data.paymentMethod === 'cash' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`} onClick={() => updateData({ paymentMethod: 'cash' })}>
                        <div className="font-semibold text-gray-900">Cash</div>
                        <div className="text-xs text-gray-500">Customers pay you directly in cash after the job.</div>
                    </div>
                    <div className={`p-4 border rounded-xl cursor-pointer transition-colors ${data.paymentMethod === 'upi' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`} onClick={() => updateData({ paymentMethod: 'upi' })}>
                        <div className="font-semibold text-gray-900">UPI / Wallets</div>
                        <div className="text-xs text-gray-500">Accept UPI, wallets, and QR payments securely.</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium text-gray-900">Account security</h3>
                    <span className="text-xs text-red-500">Required</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Create password</label>
                        <input type="password" placeholder="At least 8 chars" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={data.password} onChange={(e) => updateData({ password: e.target.value })}/>
                        <div className="h-1 w-full bg-gray-200 rounded mt-2 overflow-hidden">
                            <div className="h-full bg-orange-400 w-1/3"></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Weak</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Confirm password</label>
                        <input type="password" placeholder="Re-enter password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Two-factor authentication (2FA)</label>
                    <span className="text-xs text-gray-400">Optional</span>
                </div>
                <div className="flex items-center gap-3">
                     <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                         <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm"></div>
                     </div>
                     <span className="text-xs text-gray-600">Add an extra code on login to protect your earnings.</span>
                </div>
            </div>
        </div>
    );
};

// --- Step 9: Agreements ---
export const StepAgreements: React.FC<StepProps> = ({ data, updateData }) => {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-900">Review and accept the platform terms</h3>
                <p className="text-sm text-gray-500">Please skim through the key sections of our legal documents. You can open the full versions anytime from your dashboard.</p>
            </div>

            <div className="space-y-4">
                {[
                    { title: "Terms & Conditions", desc: "Usage rules, Platform responsibilities, Your obligations." },
                    { title: "Privacy Policy", desc: "Data we collect, Why we collect it, Your controls." },
                    { title: "Code of Conduct", desc: "Professional behavior, Safety, Anti-harassment." }
                ].map((item, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                            <button className="text-xs text-gray-500 underline">Open full document</button>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{item.desc}</p>
                        <div className="text-xs text-gray-500 leading-relaxed border-l-2 border-gray-300 pl-2">
                            By using this platform, you agree to provide accurate information, deliver services with reasonable care, and comply with applicable laws.
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Confirm your agreements</h4>
                
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" 
                        checked={data.agreedToTerms} onChange={(e) => updateData({ agreedToTerms: e.target.checked })} />
                    <span className="text-sm text-gray-700">I have read and agree to the Terms & Conditions and Privacy Policy.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        checked={data.agreedToPrivacy} onChange={(e) => updateData({ agreedToPrivacy: e.target.checked })} />
                    <span className="text-sm text-gray-700">I accept the Service Provider Agreement and confirm that I am eligible to offer the listed services.</span>
                </label>
            </div>
        </div>
    );
}

// Main ProviderSignup component
export default function ProviderSignup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState(0);

  // Define the steps array
  const steps = [
    'Personal Information',
    'Provider Type', 
    'Location',
    'Services',
    'Credentials',
    'Communication',
    'Pricing',
    'Security',
    'Agreements'
  ];

  const [data, setData] = React.useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    city: '',
    zip: '',
    state: '',
    country: '',
    radius: 5,
    providerType: 'freelancer',
    serviceCategory: undefined,
    yearsExperience: '',
    skills: [],
    bio: '',
    idProof: null,
    idProofName: '',
    idProofType: '',
    whatsapp: '',
    preferredMethod: 'call',
    hourlyRate: '',
    password: '',
    agreedToTerms: false,
    agreedToPrivacy: false,
    businessName: '',
    businessAddress: '',
    profilePhoto: null,
    profilePhotoName: '',
    profilePhotoType: '',
    paymentMethod: 'cash',
    upiId: '',
    panNumber: '',
    aadhaarNumber: '',
    portfolioPhotos: []
  });

  const updateData = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const getStepComponent = (step: number) => {
    switch(step) {
      case 0: return <StepPersonal data={data} updateData={updateData} />;
      case 1: return <StepType data={data} updateData={updateData} />;
      case 2: return <StepLocation data={data} updateData={updateData} />;
      case 3: return <StepServices data={data} updateData={updateData} />;
      case 4: return <StepCredentials data={data} updateData={updateData} />;
      case 5: return <StepCommunication data={data} updateData={updateData} />;
      case 6: return <StepPricing data={data} updateData={updateData} />;
      case 7: return <StepSecurity data={data} updateData={updateData} />;
      case 8: return <StepAgreements data={data} updateData={updateData} />;
      default: return null;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Information
        console.log('Validating Personal Info:');
        console.log('firstName:', !!data.firstName, data.firstName);
        console.log('email:', !!data.email, data.email);
        console.log('phone:', !!data.phone, data.phone);
        console.log('dob:', !!data.dob, data.dob);
        const isValid = !!(data.firstName && data.email && data.phone && data.dob);
        console.log('Personal Info validation result:', isValid);
        return isValid;
      case 1: // Provider Type
        return !!data.providerType;
      case 2: // Location
        return !!(data.address && data.city && data.zip && data.radius && data.radius > 0);
      case 3: // Services
        return !!(data.serviceCategory && data.yearsExperience && data.skills && data.skills.length > 0 && data.bio);
      case 4: // Credentials
        return !!(data.idProof);
      case 5: // Communication
        return !!(data.whatsapp && data.preferredMethod);
      case 6: // Pricing
        return !!(data.hourlyRate);
      case 7: // Security
        return !!(data.password && data.paymentMethod);
      case 8: // Agreements
        return !!(data.agreedToTerms && data.agreedToPrivacy);
      default:
        return false;
    }
  };

  const nextStep = () => {
    console.log('Current step:', currentStep);
    console.log('Current data:', data);
    console.log('Validation result:', validateStep(currentStep));
    
    if (currentStep < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === steps.length - 1 && validateStep(currentStep)) {
      // This is the final step, submit the form
      submitForm();
    } else if (!validateStep(currentStep)) {
      alert('Please fill all mandatory fields before proceeding.');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitForm = async () => {
    try {
      const formData = new FormData();
      const fullName = String(data.firstName || '').trim().replace(/\s+/g, ' ');
      const explicitLastName = String(data.lastName || '').trim();
      const [derivedFirstName, ...derivedLastParts] = fullName.split(' ').filter(Boolean);
      const normalizedFirstName = derivedFirstName || fullName || 'Provider';
      const normalizedLastName = explicitLastName || derivedLastParts.join(' ') || 'Provider';
      const normalizedEmail = String(data.email || '').trim().toLowerCase();
      const normalizedPhone = String(data.phone || '').replace(/[^\d+]/g, '');
      const experienceYears = Number.parseInt(String(data.yearsExperience || '0'), 10);
      const normalizedBusinessAddress = [data.address, data.city, data.state, data.zip]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join(', ');

      formData.append('firstName', normalizedFirstName);
      formData.append('lastName', normalizedLastName);
      formData.append('email', normalizedEmail);
      formData.append('userType', 'PROVIDER');
      formData.append('phone', normalizedPhone);
      formData.append('password', data.password);
      formData.append('businessName', String(data.businessName || `${normalizedFirstName} Services`).trim());
      formData.append('businessAddress', normalizedBusinessAddress);
      formData.append('area', String(data.city || 'Not specified').trim());
      formData.append('serviceCategory', String(data.serviceCategory || 'General'));
      formData.append('yearsExperience', String(Number.isFinite(experienceYears) ? Math.max(experienceYears, 0) : 0));

      if (String(data.panNumber || '').trim()) {
        formData.append('panNumber', String(data.panNumber).trim());
      }
      if (String(data.aadhaarNumber || '').trim()) {
        formData.append('aadhaarNumber', String(data.aadhaarNumber).trim());
      }
      if (String(data.upiId || '').trim()) {
        formData.append('upiId', String(data.upiId).trim());
      }
      if (data.profilePhoto instanceof File) {
        formData.append('profileImage', data.profilePhoto);
      }

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        body: formData
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
      }

      const result = await response.json();
      if (!result.success) {
        const validationDetails = Array.isArray(result.errors)
          ? result.errors.map((err: { path?: string; msg?: string }) => `${err.path || 'field'}: ${err.msg || 'invalid'}`).join(', ')
          : '';

        throw new Error(validationDetails ? `${result.message}: ${validationDetails}` : (result.message || 'Registration failed'));
      }

      const accessToken = result?.data?.accessToken;
      const refreshToken = result?.data?.refreshToken;
      const user = result?.data?.user;
      const providerId = user?.provider?.id;

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (user?.id) {
        localStorage.setItem('userId', String(user.id));
      }
      localStorage.setItem('userType', 'PROVIDER');
      if (providerId) {
        localStorage.setItem('providerId', String(providerId));
      }

      navigate('/provider/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      alert('Registration failed: ' + (error?.message || 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" style={{ fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
      <div className="min-h-screen backdrop-blur-lg bg-black/20">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white">ServoLeY</h1>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Already have an account? Login
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-6">
          <div className="w-full max-w-4xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="overflow-x-auto no-scrollbar pb-2">
                <div className="flex items-center justify-start sm:justify-center gap-3 min-w-[760px]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
                    <React.Fragment key={step}>
                      <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all ${
                        currentStep >= step 
                          ? 'bg-white border-white text-indigo-900' 
                          : 'border-white/30 text-white/50'
                      }`}>
                        {currentStep > step ? (
                          <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <span className="font-semibold text-sm sm:text-base">{step}</span>
                        )}
                      </div>
                      {step < 9 && (
                        <div className={`h-1 w-10 sm:w-16 transition-all ${
                          currentStep > step ? 'bg-white' : 'bg-white/30'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex flex-wrap justify-center mt-4 gap-x-4 gap-y-2 text-sm text-white/70">
                <span className={currentStep >= 1 ? 'text-white' : ''}>Personal Info</span>
                <span className={currentStep >= 2 ? 'text-white' : ''}>Provider Type</span>
                <span className={currentStep >= 3 ? 'text-white' : ''}>Location</span>
                <span className={currentStep >= 4 ? 'text-white' : ''}>Services</span>
                <span className={currentStep >= 5 ? 'text-white' : ''}>Credentials</span>
                <span className={currentStep >= 6 ? 'text-white' : ''}>Communication</span>
                <span className={currentStep >= 7 ? 'text-white' : ''}>Pricing</span>
                <span className={currentStep >= 8 ? 'text-white' : ''}>Security</span>
                <span className={currentStep >= 9 ? 'text-white' : ''}>Complete</span>
              </div>
              <p className="sm:hidden text-center text-sm text-white/80 mt-3">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
              </p>
            </div>

            {/* Form container */}
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-gray-200 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-indigo-700" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Your Provider Account</h2>
                <p className="text-gray-600">Join thousands of service providers on ServoLeY</p>
              </div>

              {/* Step Content */}
              <div className="min-h-[320px] sm:min-h-[400px]">
                {getStepComponent(currentStep)}
              </div>

              {/* Navigation */}
              <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 gap-3">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    currentStep === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={submitForm}
                    className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                  >
                    Submit
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

