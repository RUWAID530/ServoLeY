import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config/api'

interface TimeSlot {
  id: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  startTime: string
  endTime: string
  isActive: boolean
}

interface SpecialAvailability {
  id: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  reason?: string
}

interface WeeklySchedule {
  [key: string]: {
    active: boolean
    slots: {
      id: string
      startTime: string
      endTime: string
    }[]
  }
}

const daysOfWeek = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]

export default function Availability() {
  const [weeklyAvailability, setWeeklyAvailability] = useState<TimeSlot[]>([])
  const [specialAvailability, setSpecialAvailability] = useState<SpecialAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'weekly' | 'calendar'>('weekly')
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null)
  const [editingSpecialDay, setEditingSpecialDay] = useState<SpecialAvailability | null>(null)
  const [isAddingSpecialDay, setIsAddingSpecialDay] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(1) // Default to Monday
  const [formData, setFormData] = useState({
    dayOfWeek: '1',
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
    date: '',
    isAvailable: false,
    reason: ''
  })
  const [message, setMessage] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    fetchWeeklyAvailability()
    fetchSpecialAvailability()
  }, [])

  const fetchWeeklyAvailability = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/provider/availability/weekly`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setWeeklyAvailability(data.data)
      }
    } catch (error) {
      console.error('Error fetching weekly availability:', error)
    }
  }

  const fetchSpecialAvailability = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/provider/availability/special`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSpecialAvailability(data.data)
      }
    } catch (error) {
      console.error('Error fetching special availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditTimeSlot = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot)
    setEditingSpecialDay(null)
    setIsAddingSpecialDay(false)
    setFormData({
      dayOfWeek: timeSlot.dayOfWeek.toString(),
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isActive: timeSlot.isActive,
      date: '',
      isAvailable: false,
      reason: ''
    })
  }

  const handleAddTimeSlot = () => {
    setEditingTimeSlot(null)
    setEditingSpecialDay(null)
    setIsAddingSpecialDay(false)
    setFormData({
      dayOfWeek: selectedDay.toString(),
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
      date: '',
      isAvailable: false,
      reason: ''
    })
  }

  const handleAddSpecialDay = () => {
    setEditingTimeSlot(null)
    setEditingSpecialDay(null)
    setIsAddingSpecialDay(true)
    setFormData({
      dayOfWeek: '1',
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
      date: new Date().toISOString().split('T')[0],
      isAvailable: false,
      reason: ''
    })
  }

  const handleEditSpecialDay = (specialDay: SpecialAvailability) => {
    setEditingTimeSlot(null)
    setEditingSpecialDay(specialDay)
    setIsAddingSpecialDay(false)
    setFormData({
      dayOfWeek: '1',
      startTime: specialDay.startTime,
      endTime: specialDay.endTime,
      isActive: true,
      date: specialDay.date,
      isAvailable: specialDay.isAvailable,
      reason: specialDay.reason || ''
    })
  }

  const handleCancel = () => {
    setEditingTimeSlot(null)
    setEditingSpecialDay(null)
    setIsAddingSpecialDay(false)
    setMessage('')
  }

  const handleSubmitTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const url = editingTimeSlot 
        ? `${API_BASE}/provider/availability/weekly/${editingTimeSlot.id}`
        : `${API_BASE}/provider/availability/weekly`
      
      const method = editingTimeSlot ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dayOfWeek: parseInt(formData.dayOfWeek),
          startTime: formData.startTime,
          endTime: formData.endTime,
          isActive: formData.isActive
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage(editingTimeSlot ? 'Time slot updated successfully!' : 'Time slot added successfully!')
        fetchWeeklyAvailability()
        handleCancel()
      } else {
        setMessage(data.message || 'Failed to save time slot')
      }
    } catch (error) {
      setMessage('Error saving time slot. Please try again.')
      console.error('Error saving time slot:', error)
    }
  }

  const handleSubmitSpecialDay = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('token')
      const url = editingSpecialDay 
        ? `${API_BASE}/provider/availability/special/${editingSpecialDay.id}`
        : `${API_BASE}/provider/availability/special`
      
      const method = editingSpecialDay ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          isAvailable: formData.isAvailable,
          reason: formData.reason
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage(editingSpecialDay ? 'Special day updated successfully!' : 'Special day added successfully!')
        fetchSpecialAvailability()
        handleCancel()
      } else {
        setMessage(data.message || 'Failed to save special day')
      }
    } catch (error) {
      setMessage('Error saving special day. Please try again.')
      console.error('Error saving special day:', error)
    }
  }

  const handleDeleteTimeSlot = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/provider/availability/weekly/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchWeeklyAvailability()
      } else {
        console.error('Failed to delete time slot')
      }
    } catch (error) {
      console.error('Error deleting time slot:', error)
    }
  }

  const handleDeleteSpecialDay = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this special day?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/provider/availability/special/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchSpecialAvailability()
      } else {
        console.error('Failed to delete special day')
      }
    } catch (error) {
      console.error('Error deleting special day:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  const getDayName = (dayOfWeek: number) => {
    return daysOfWeek[dayOfWeek]
  }

  const organizeWeeklySchedule = (): WeeklySchedule => {
    const schedule: WeeklySchedule = {}
    
    // Initialize all days
    daysOfWeek.forEach((day, index) => {
      schedule[day] = {
        active: false,
        slots: []
      }
    })
    
    // Populate with actual data
    weeklyAvailability.forEach(slot => {
      const dayName = getDayName(slot.dayOfWeek)
      if (slot.isActive) {
        schedule[dayName].active = true
        schedule[dayName].slots.push({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime
        })
      }
    })
    
    return schedule
  }

  const getSpecialDayForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return specialAvailability.find(day => day.date === dateStr)
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // Start from the first day of the week that includes the first day of the month
    const startDay = new Date(firstDay)
    startDay.setDate(firstDay.getDate() - firstDay.getDay())
    
    // End at the last day of the week that includes the last day of the month
    const endDay = new Date(lastDay)
    endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
    
    const calendarDays: Date[] = []
    const currentDay = new Date(startDay)
    
  
    const renderCalendar = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        
        // First day of the month
        const firstDay = new Date(year, month, 1)
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0)
        
        // Start from the first day of the week that includes the first day of the month
        const startDay = new Date(firstDay)
        startDay.setDate(firstDay.getDate() - firstDay.getDay())
        
        // End at the last day of the week that includes the last day of the month
        const endDay = new Date(lastDay)
        endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
        
        const calendarDays: Date[] = []
        const currentDay = new Date(startDay)
        
        while (currentDay <= endDay) {
          calendarDays.push(new Date(currentDay)) // Create a new Date object to avoid reference issues
          currentDay.setDate(currentDay.getDate() + 1)
        }
        
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            // ... rest of the JSX ...
          
        
      

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const prevMonth = new Date(currentMonth)
                    prevMonth.setMonth(prevMonth.getMonth() - 1)
                    setCurrentMonth(prevMonth)
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const nextMonth = new Date(currentMonth)
                    nextMonth.setMonth(nextMonth.getMonth() + 1)
                    setCurrentMonth(nextMonth)
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px border-b border-gray-200 bg-gray-200">
              {daysOfWeek.map(day => (
                <div key={day} className="bg-white py-2 text-center text-sm font-medium text-gray-500">
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === month
                const isToday = new Date().toDateString() === date.toDateString()
                const specialDay = getSpecialDayForDate(date)
                const dayOfWeek = date.getDay()
                const weeklyDay = weeklyAvailability.find(slot => slot.dayOfWeek === dayOfWeek && slot.isActive)
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-24 bg-white p-2 ${
                      !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    }`}
                  >
                    <div className={`flex justify-between ${isToday ? 'bg-blue-100 rounded-full w-6 h-6 items-center justify-center flex' : ''}`}>
                      <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{date.getDate()}</span>
                      {specialDay && (
                        <span className={`w-2 h-2 rounded-full ${
                          specialDay.isAvailable ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                      )}
                    </div>
                    
                    {weeklyDay && isCurrentMonth && (
                      <div className="mt-1 text-xs">
                        <span className="bg-blue-100 text-blue-800 rounded px-1 py-0.5">
                          {formatTime(weeklyDay.startTime)} - {formatTime(weeklyDay.endTime)}
                        </span>
                      </div>
                    )}
                    
                    {specialDay && isCurrentMonth && (
                      <div className="mt-1 text-xs">
                        <span className={`rounded px-1 py-0.5 ${
                          specialDay.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {specialDay.reason || 'Special day'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      }
    
    const day = new Date(startDay)
    
    while (day <= endDay) {
      calendarDays.push(new Date(day)) // Create a new Date object to avoid reference issues
      day.setDate(day.getDate() + 1)
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const prevMonth = new Date(currentMonth)
                prevMonth.setMonth(prevMonth.getMonth() - 1)
                setCurrentMonth(prevMonth)
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Today
            </button>
            <button
              onClick={() => {
                const nextMonth = new Date(currentMonth)
                nextMonth.setMonth(nextMonth.getMonth() + 1)
                setCurrentMonth(nextMonth)
              }}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px border-b border-gray-200 bg-gray-200">
          {daysOfWeek.map(day => (
            <div key={day} className="bg-white py-2 text-center text-sm font-medium text-gray-500">
              {day.substring(0, 3)}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === month
            const isToday = new Date().toDateString() === date.toDateString()
            const specialDay = getSpecialDayForDate(date)
            const dayOfWeek = date.getDay()
            const weeklyDay = weeklyAvailability.find(slot => slot.dayOfWeek === dayOfWeek && slot.isActive)
            
            return (
              <div 
                key={index} 
                className={`min-h-24 bg-white p-2 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                }`}
              >
                <div className={`flex justify-between ${isToday ? 'bg-blue-100 rounded-full w-6 h-6 items-center justify-center flex' : ''}`}>
                  <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>{date.getDate()}</span>
                  {specialDay && (
                    <span className={`w-2 h-2 rounded-full ${
                      specialDay.isAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                  )}
                </div>
                
                {weeklyDay && isCurrentMonth && (
                  <div className="mt-1 text-xs">
                    <span className="bg-blue-100 text-blue-800 rounded px-1 py-0.5">
                      {formatTime(weeklyDay.startTime)} - {formatTime(weeklyDay.endTime)}
                    </span>
                  </div>
                )}
                
                {specialDay && isCurrentMonth && (
                  <div className="mt-1 text-xs">
                    <span className={`rounded px-1 py-0.5 ${
                      specialDay.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {specialDay.reason || 'Special day'}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }


  const weeklySchedule = organizeWeeklySchedule()

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Availability</h1>
        <Link to="/inbox" className="text-blue-600 hover:underline">Back to Inbox</Link>
      </div>
      
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setViewMode('weekly')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'weekly' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Weekly Schedule
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'calendar' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Calendar View
        </button>
      </div>
      
      {(editingTimeSlot || isAddingSpecialDay || editingSpecialDay) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">
            {editingTimeSlot ? 'Edit Weekly Time Slot' : 
             editingSpecialDay ? 'Edit Special Day' : 'Add Special Day'}
          </h2>
          <form onSubmit={editingTimeSlot ? handleSubmitTimeSlot : handleSubmitSpecialDay}>
            {editingTimeSlot ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dayOfWeek">
                    Day of Week
                  </label>
                  <select
                    id="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    {daysOfWeek.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startTime">
                    Start Time
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endTime">
                    End Time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Available</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startTime">
                    Start Time
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endTime">
                    End Time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
                    Reason
                  </label>
                  <input
                    id="reason"
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="e.g. Holiday, Vacation, etc."
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            )}
            
            {message && <p className={`mb-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {editingTimeSlot || editingSpecialDay ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {viewMode === 'calendar' ? (
        <div className="mb-6">
          {renderCalendar()}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Weekly Availability</h2>
            </div>
            
            {loading ? (
              <div className="p-6">
                <p>Loading availability...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {Object.entries(weeklySchedule).map(([day, schedule]) => (
                  <div key={day} className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{day}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          schedule.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.active ? 'Available' : 'Unavailable'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDay(daysOfWeek.indexOf(day))
                            handleAddTimeSlot()
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    {schedule.active && schedule.slots.length > 0 && (
                      <div className="space-y-2">
                        {schedule.slots.map(slot => (
                          <div key={slot.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  const timeSlot = weeklyAvailability.find(t => t.id === slot.id)
                                  if (timeSlot) handleEditTimeSlot(timeSlot)
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTimeSlot(slot.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Special Days</h2>
              <button
                onClick={handleAddSpecialDay}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                Add Special Day
              </button>
            </div>
            
            {loading ? (
              <div className="p-6">
                <p>Loading special days...</p>
              </div>
            ) : specialAvailability.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {specialAvailability
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((specialDay) => (
                  <div key={specialDay.id} className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{formatDate(specialDay.date)}</h3>
                        <p className="text-gray-600">
                          {formatTime(specialDay.startTime)} - {formatTime(specialDay.endTime)}
                        </p>
                        {specialDay.reason && (
                          <p className="text-sm text-gray-500 mt-1">{specialDay.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          specialDay.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {specialDay.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                        <button
                          onClick={() => handleEditSpecialDay(specialDay)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSpecialDay(specialDay.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No special days set.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
