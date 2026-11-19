import React, { useState, useEffect } from 'react';
import { DaySchedule, MessMenuConfig, User } from '../types';
import { api } from '../api/client';
import { getLocalDateStr, formatDateLabel } from '../utils/date';
import {
  Calendar,
  Image as ImageIcon,
  Table as TableIcon,
  Download,
  Printer,
  Sparkles,
  Upload,
  ZoomIn,
  Search,
  CheckCircle,
  Clock,
  Flame,
  Sun,
  Utensils,
  Coffee,
  Moon,
  Info,
  X,
  FileText
} from 'lucide-react';

interface WeeklyMenuTableProps {
  user: User | null;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const WeeklyMenuTable: React.FC<WeeklyMenuTableProps> = ({ user, selectedDate, onSelectDate }) => {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);
  const [menuConfig, setMenuConfig] = useState<MessMenuConfig>({ imageUrl: null, updatedAt: '' });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'sheet'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Image Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Lightbox
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const todayStr = getLocalDateStr();

  const loadWeeklyData = async () => {
    setLoading(true);
    try {
      const [schedule, config] = await Promise.all([
        api.menu.getWeekly(selectedDate),
        api.settings.getMenuImage(),
      ]);
      setWeeklySchedule(schedule);
      setMenuConfig(config);
    } catch (err) {
      console.error('Error fetching weekly menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeeklyData();
  }, [selectedDate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMenuImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl) return;

    try {
      await api.settings.saveMenuImage({
        imageUrl: uploadUrl,
        notes: uploadNotes,
      });
      setIsUploadOpen(false);
      loadWeeklyData();
      setViewMode('sheet');
    } catch (err: any) {
      alert(err.message || 'Failed to save menu image');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Single-Page Everyday Master Schedule</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Weekly Hostel Mess Menu & Official Sheet
          </h2>
          <p className="text-xs text-slate-400">
            View everyday's complete meal schedule (Monday to Sunday) or inspect the scanned Mess Board menu photo.
          </p>
        </div>

        {/* Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Everyday Table</span>
            </button>

            <button
              onClick={() => setViewMode('sheet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'sheet'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Menu Board Photo</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-all"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Menu Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Full Everyday Matrix Table */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          
          {/* Table Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Highlight dishes across the week (e.g. Paneer, Idli, Biryani, Chole)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Mess Timings: B (8:00 - 9:00 AM), L (12:30 - 1:30 PM), S (5:00 - 5:30 PM), D (8:00 - 9:00 PM)</span>
            </div>
          </div>

          {/* Master 7-Day Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                
                {/* Table Header */}
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="p-4 font-extrabold text-amber-400 uppercase tracking-wider w-36 border-r border-slate-800">
                      Day & Date
                    </th>
                    
                    <th className="p-4 font-bold border-r border-slate-800 min-w-[200px]">
                      <div className="flex items-center space-x-2 text-amber-400">
                        <Sun className="w-4 h-4" />
                        <span>Breakfast</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">8:00 AM – 9:00 AM</span>
                    </th>

                    <th className="p-4 font-bold border-r border-slate-800 min-w-[220px]">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <Utensils className="w-4 h-4" />
                        <span>Lunch</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">12:30 PM – 1:30 PM</span>
                    </th>

                    <th className="p-4 font-bold border-r border-slate-800 min-w-[200px]">
                      <div className="flex items-center space-x-2 text-orange-400">
                        <Coffee className="w-4 h-4" />
                        <span>Snacks</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">5:00 PM – 5:30 PM</span>
                    </th>

                    <th className="p-4 font-bold min-w-[220px]">
                      <div className="flex items-center space-x-2 text-purple-400">
                        <Moon className="w-4 h-4" />
                        <span>Dinner</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">8:00 PM – 9:00 PM</span>
                    </th>
                  </tr>
                </thead>

                {/* Table Body - 7 Days */}
                <tbody className="divide-y divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">
                        Loading weekly mess schedule...
                      </td>
                    </tr>
                  ) : (
                    weeklySchedule.map((daySched) => {
                      const isToday = daySched.date === todayStr;

                      return (
                        <tr
                          key={daySched.day}
                          className={`transition-colors hover:bg-slate-800/30 ${
                            isToday ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                          }`}
                        >
                          {/* Day Column */}
                          <td className="p-4 border-r border-slate-800/80 align-top">
                            <div className="space-y-1">
                              <span className="font-extrabold text-white text-sm block">
                                {daySched.day}
                              </span>
                              <span className="text-[11px] text-slate-400 block font-mono">
                                {daySched.date}
                              </span>

                              {isToday ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                  <span>TODAY</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => onSelectDate(daySched.date)}
                                  className="text-[10px] text-amber-400 hover:underline font-semibold block"
                                >
                                  View Daily
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Breakfast Cell */}
                          <td className="p-4 border-r border-slate-800/80 align-top space-y-1.5">
                            <ul className="space-y-1">
                              {daySched.breakfast.items.map((item, idx) => {
                                const matches = searchQuery && item.toLowerCase().includes(searchQuery.toLowerCase());
                                return (
                                  <li
                                    key={idx}
                                    className={`text-xs ${
                                      matches ? 'bg-amber-500/30 text-amber-200 font-bold px-1 rounded' : 'text-slate-200'
                                    }`}
                                  >
                                    • {item}
                                  </li>
                                );
                              })}
                            </ul>

                            {daySched.breakfast.specialNotes && (
                              <div className="text-[10px] text-amber-400/90 pt-1 border-t border-slate-800/60 font-medium">
                                💡 {daySched.breakfast.specialNotes}
                              </div>
                            )}
                          </td>

                          {/* Lunch Cell */}
                          <td className="p-4 border-r border-slate-800/80 align-top space-y-1.5">
                            <ul className="space-y-1">
                              {daySched.lunch.items.map((item, idx) => {
                                const matches = searchQuery && item.toLowerCase().includes(searchQuery.toLowerCase());
                                return (
                                  <li
                                    key={idx}
                                    className={`text-xs ${
                                      matches ? 'bg-amber-500/30 text-amber-200 font-bold px-1 rounded' : 'text-slate-200'
                                    }`}
                                  >
                                    • {item}
                                  </li>
                                );
                              })}
                            </ul>

                            {daySched.lunch.specialNotes && (
                              <div className="text-[10px] text-emerald-400/90 pt-1 border-t border-slate-800/60 font-medium">
                                💡 {daySched.lunch.specialNotes}
                              </div>
                            )}
                          </td>

                          {/* Snacks Cell */}
                          <td className="p-4 border-r border-slate-800/80 align-top space-y-1.5">
                            <ul className="space-y-1">
                              {daySched.snacks.items.map((item, idx) => {
                                const matches = searchQuery && item.toLowerCase().includes(searchQuery.toLowerCase());
                                return (
                                  <li
                                    key={idx}
                                    className={`text-xs ${
                                      matches ? 'bg-amber-500/30 text-amber-200 font-bold px-1 rounded' : 'text-slate-200'
                                    }`}
                                  >
                                    • {item}
                                  </li>
                                );
                              })}
                            </ul>

                            {daySched.snacks.specialNotes && (
                              <div className="text-[10px] text-orange-400/90 pt-1 border-t border-slate-800/60 font-medium">
                                💡 {daySched.snacks.specialNotes}
                              </div>
                            )}
                          </td>

                          {/* Dinner Cell */}
                          <td className="p-4 align-top space-y-1.5">
                            <ul className="space-y-1">
                              {daySched.dinner.items.map((item, idx) => {
                                const matches = searchQuery && item.toLowerCase().includes(searchQuery.toLowerCase());
                                return (
                                  <li
                                    key={idx}
                                    className={`text-xs ${
                                      matches ? 'bg-amber-500/30 text-amber-200 font-bold px-1 rounded' : 'text-slate-200'
                                    }`}
                                  >
                                    • {item}
                                  </li>
                                );
                              })}
                            </ul>

                            {daySched.dinner.specialNotes && (
                              <div className="text-[10px] text-purple-400/90 pt-1 border-t border-slate-800/60 font-medium">
                                💡 {daySched.dinner.specialNotes}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Official Menu Board Sheet / Image View */}
      {viewMode === 'sheet' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Hostel Mess Board Menu Photo Sheet</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {menuConfig.imageUrl
                  ? `Uploaded Mess Menu Board image. Last updated: ${menuConfig.updatedAt || 'Recently'}`
                  : 'Synthesized Mess Menu Poster Board (Admin can upload original mess notice board photo below)'}
              </p>
            </div>

            {menuConfig.imageUrl && (
              <button
                onClick={() => setIsZoomOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center space-x-1 border border-slate-700"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Fullscreen Zoom</span>
              </button>
            )}
          </div>

          {/* Image Container or Graphical Poster Board */}
          {menuConfig.imageUrl ? (
            <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 flex justify-center">
              <img
                src={menuConfig.imageUrl}
                alt="Hostel Mess Menu Sheet"
                className="max-h-[700px] w-auto object-contain rounded-xl shadow-2xl transition-transform cursor-pointer"
                onClick={() => setIsZoomOpen(true)}
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center space-x-2">
                  <ZoomIn className="w-4 h-4" />
                  <span>Click to Expand Mess Board Photo</span>
                </span>
              </div>
            </div>
          ) : (
            /* Digital Stylized Poster Board Sheet */
            <div className="rounded-3xl bg-gradient-to-br from-amber-950/20 via-slate-950 to-orange-950/20 border-2 border-amber-500/30 p-8 shadow-2xl text-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Poster Header */}
              <div className="text-center border-b-2 border-amber-500/30 pb-6 mb-6">
                <div className="inline-block border-2 border-amber-500/40 px-6 py-1 rounded-full text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-2 bg-amber-500/10">
                  CENTRAL HOSTEL MESS BOARD
                </div>
                <h2 className="text-3xl font-black tracking-wider text-white uppercase">
                  WEEKLY MESS MENU SCHEDULE
                </h2>
                <p className="text-xs text-amber-300 font-semibold mt-1">
                  OFFICIAL MEAL SPREAD • MONDAY TO SUNDAY
                </p>
              </div>

              {/* Poster 7-Day Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {weeklySchedule.map((ds) => (
                  <div
                    key={ds.day}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg relative"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-amber-400 text-base uppercase">
                        {ds.day}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{ds.date}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-amber-300 text-[11px]">Morning Breakfast:</span>
                        <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                          {ds.breakfast.items.join(', ')}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-emerald-300 text-[11px]">Afternoon Lunch:</span>
                        <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                          {ds.lunch.items.join(', ')}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-orange-300 text-[11px]">Evening Snacks:</span>
                        <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                          {ds.snacks.items.join(', ')}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-purple-300 text-[11px]">Night Dinner:</span>
                        <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                          {ds.dinner.items.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-amber-500/20 text-center text-[11px] text-slate-400">
                Approved by Chief Mess Warden & Student Mess Committee • Quality & Hygiene Standards Guaranteed
              </div>
            </div>
          )}

          {menuConfig.notes && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-amber-300 flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{menuConfig.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Admin Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-amber-400" />
              <span>Upload Official Mess Menu Photo</span>
            </h3>

            <form onSubmit={handleSaveMenuImage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Or Paste Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              {uploadUrl && (
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 max-h-48 overflow-hidden flex justify-center">
                  <img src={uploadUrl} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Caption / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Official November Mess Schedule Chart"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20"
              >
                Save Mess Board Photo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {isZoomOpen && menuConfig.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 shadow-xl"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={menuConfig.imageUrl}
            alt="Fullscreen Mess Menu Board"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-slate-800"
          />
        </div>
      )}

    </div>
  );
};
