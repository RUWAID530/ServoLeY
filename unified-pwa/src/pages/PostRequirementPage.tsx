
import React from 'react';

const PostRequirementPage: React.FC = () => {
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Post a Requirement</h1>
      <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Service Category</label>
            <select className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none">
              <option>Select a category</option>
              <option>Home Services</option>
              <option>Electronics</option>
              <option>Education</option>
              <option>Health & Wellness</option>
              <option>Transportation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Service Details</label>
            <textarea 
              className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none" 
              rows={4} 
              placeholder="Describe the service you need..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input 
              type="text" 
              className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none" 
              placeholder="Enter your location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Budget Range</label>
            <div className="flex space-x-4">
              <input 
                type="number" 
                className="w-1/2 p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none" 
                placeholder="Min"
              />
              <input 
                type="number" 
                className="w-1/2 p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none" 
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Date</label>
            <input 
              type="date" 
              className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none" 
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Post Requirement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostRequirementPage;
