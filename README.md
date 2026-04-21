# 📅 Booking System API

A RESTful API for managing appointments and bookings between service providers and clients. Built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication** - Register, Login with JWT tokens
- **Role-Based Access** - Client, Provider, and Admin roles
- **Service Management** - Providers can create and manage services
- **Availability System** - Providers set their working schedule
- **Smart Booking** - Book appointments with conflict detection
- **Email Notifications** - Automated emails for booking events
- **Review System** - Clients can rate and review providers
- **Rate Limiting** - API protection against abuse
- **Input Validation** - Request data validation with Joi
- **Error Handling** - Centralized error handling

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt.js
- **Validation:** Joi
- **Email:** Nodemailer
- **Security:** Helmet, CORS, Rate Limiting

## 📋 API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |

### 🛎️ Services
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/services` | Get all services | Public |
| GET | `/api/services/:id` | Get single service | Public |
| POST | `/api/services` | Create service | Provider |
| PUT | `/api/services/:id` | Update service | Provider (Owner) |
| DELETE | `/api/services/:id` | Delete service | Provider (Owner) |

### 📅 Availability
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/availability/provider/:providerId` | Get provider schedule | Public |
| GET | `/api/availability/provider/:providerId/slots` | Get available slots | Public |
| POST | `/api/availability` | Set availability | Provider |
| PUT | `/api/availability/:dayOfWeek` | Update day schedule | Provider |
| DELETE | `/api/availability/:dayOfWeek` | Delete day schedule | Provider |

### 📋 Bookings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/bookings` | Create booking | Client |
| GET | `/api/bookings` | Get my bookings | Private |
| GET | `/api/bookings/upcoming` | Get upcoming bookings | Private |
| GET | `/api/bookings/:id` | Get single booking | Private |
| PUT | `/api/bookings/:id/confirm` | Confirm booking | Provider |
| PUT | `/api/bookings/:id/cancel` | Cancel booking | Private |
| PUT | `/api/bookings/:id/complete` | Complete booking | Provider |
| PUT | `/api/bookings/:id/reschedule` | Reschedule booking | Private |

### ⭐ Reviews
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/reviews` | Create review | Client |
| GET | `/api/reviews/provider/:providerId` | Get provider reviews | Public |
| GET | `/api/reviews/me` | Get my reviews | Client |
| DELETE | `/api/reviews/:id` | Delete review | Client (Owner) |

## ⚙️ Installation

### Prerequisites
- Node.js (v16+)
- MongoDB
- Git

### Steps

1. **Clone the repository**
```bash
Role-Based Authorization
👨‍💻 Author
Your walidmohamed16 - GitHub       
