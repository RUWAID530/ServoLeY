import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_BASE from '../App'


interface Ticket {
  id: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  userId: string
  userName: string
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  ticketId: string
  senderId: string
  senderName: string
  senderType: 'admin' | 'customer' | 'provider'
  content: string
  createdAt: string
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket)
    }
  }, [selectedTicket])

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTickets(data.data)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (ticketId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/tickets/${ticketId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/tickets/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchTickets()
      } else {
        console.error('Failed to update ticket status')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const assignTicket = async (id: string, adminId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/tickets/${id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId })
      })

      if (response.ok) {
        fetchTickets()
      } else {
        console.error('Failed to assign ticket')
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !selectedTicket) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/tickets/${selectedTicket}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedTicket)
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-gray-100 text-gray-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredTickets = tickets.filter(ticket => 
    (statusFilter === 'all' || ticket.status === statusFilter) &&
    (priorityFilter === 'all' || ticket.priority === priorityFilter)
  )

  const selectedTicketData = tickets.find(t => t.id === selectedTicket)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Support Tickets</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'open' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setStatusFilter('in-progress')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'in-progress' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'resolved' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Resolved
              </button>
              <button
                onClick={() => setStatusFilter('closed')}
                className={`px-3 py-1 text-sm rounded-full ${
                  statusFilter === 'closed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Closed
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  priorityFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPriorityFilter('low')}
                className={`px-3 py-1 text-sm rounded-full ${
                  priorityFilter === 'low' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setPriorityFilter('medium')}
                className={`px-3 py-1 text-sm rounded-full ${
                  priorityFilter === 'medium' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setPriorityFilter('high')}
                className={`px-3 py-1 text-sm rounded-full ${
                  priorityFilter === 'high' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setPriorityFilter('urgent')}
                className={`px-3 py-1 text-sm rounded-full ${
                  priorityFilter === 'urgent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading tickets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Tickets</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedTicket === ticket.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedTicket(ticket.id)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{ticket.title}</h3>
                          <p className="text-xs text-gray-500">
                            {ticket.userName} • {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    No tickets found
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {selectedTicketData ? (
              <>
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                      {selectedTicketData.title}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicketData.status)}`}>
                        {selectedTicketData.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicketData.priority)}`}>
                        {selectedTicketData.priority}
                      </span>
                      <select
                        value={selectedTicketData.status}
                        onChange={(e) => updateTicketStatus(selectedTicketData.id, e.target.value)}
                        className="text-sm border rounded p-1"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="font-medium">{formatDate(selectedTicketData.createdAt)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-medium">{formatDate(selectedTicketData.updatedAt)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">User</p>
                        <p className="font-medium">{selectedTicketData.userName}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Assigned To</p>
                        <p className="font-medium">{selectedTicketData.assignedToName || 'Unassigned'}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-gray-900">{selectedTicketData.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Messages</h2>
                  </div>
                  <div className="p-6 max-h-96 overflow-y-auto">
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div 
                            key={message.id} 
                            className={`p-4 rounded-lg ${
                              message.senderType === 'admin' ? 'bg-blue-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900">{message.senderName}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No messages yet
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 py-4 border-t border-gray-200">
                    <form onSubmit={sendMessage} className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v2m2 4h.01M12 14h.01M16 14h.01M9 18H5a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2m2 4h.01M12 18h.01M16 18h.01" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No ticket selected</h3>
                <p className="mt-1 text-gray-500">Select a ticket from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
