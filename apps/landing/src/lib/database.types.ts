export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Solicitações de acesso (formulário de cadastro da landing)
      access_requests: {
        Row: {
          id: string
          salon_name: string
          owner_name: string
          email: string
          phone: string
          city: string
          state: string
          professionals: string
          message: string | null
          status: 'pending' | 'approved' | 'rejected' | 'awaiting_payment' | 'provisioning' | 'payment_confirmed' | 'failed'
          // Enterprise Onboarding Fields
          payment_status: 'pending' | 'approved' | 'rejected' | 'refunded' | null
          payment_reference: string | null
          payment_id: string | null
          onboarding_stage: 'form_submitted' | 'approved' | 'payment_pending' | 'payment_received' | 'provisioning' | 'completed' | 'failed' | null
          provisioned_salon_id: string | null
          provisioned_user_id: string | null
          provisioning_attempts: number
          provisioning_error: string | null
          // Payment fields
          payment_method: string | null
          payment_amount: number | null
          paid_at: string | null
          payment_raw_data: Json | null
          // Address fields
          address_zip: string | null
          address_street: string | null
          address_number: string | null
          address_neighborhood: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_name: string
          owner_name: string
          email: string
          phone: string
          city: string
          state: string
          professionals: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'awaiting_payment' | 'provisioning' | 'payment_confirmed' | 'failed'
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded' | null
          payment_reference?: string | null
          payment_id?: string | null
          onboarding_stage?: 'form_submitted' | 'approved' | 'payment_pending' | 'payment_received' | 'provisioning' | 'completed' | 'failed' | null
          provisioned_salon_id?: string | null
          provisioned_user_id?: string | null
          provisioning_attempts?: number
          provisioning_error?: string | null
          payment_method?: string | null
          payment_amount?: number | null
          paid_at?: string | null
          payment_raw_data?: Json | null
          address_zip?: string | null
          address_street?: string | null
          address_number?: string | null
          address_neighborhood?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_name?: string
          owner_name?: string
          email?: string
          phone?: string
          city?: string
          state?: string
          professionals?: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'awaiting_payment' | 'provisioning' | 'payment_confirmed' | 'failed'
          payment_status?: 'pending' | 'approved' | 'rejected' | 'refunded' | null
          payment_reference?: string | null
          payment_id?: string | null
          onboarding_stage?: 'form_submitted' | 'approved' | 'payment_pending' | 'payment_received' | 'provisioning' | 'completed' | 'failed' | null
          provisioned_salon_id?: string | null
          provisioned_user_id?: string | null
          provisioning_attempts?: number
          provisioning_error?: string | null
          payment_method?: string | null
          payment_amount?: number | null
          paid_at?: string | null
          payment_raw_data?: Json | null
          address_zip?: string | null
          address_street?: string | null
          address_number?: string | null
          address_neighborhood?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Salões cadastrados
      salons: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          owner_name: string
          owner_cpf: string | null
          email: string
          phone: string
          address: string | null
          city: string
          state: string
          plan: 'starter' | 'basic' | 'pro' | 'enterprise'
          professionals_count: string
          status: 'active' | 'inactive' | 'suspended'
          // Enterprise address fields
          address_zip: string | null
          address_street: string | null
          address_number: string | null
          address_neighborhood: string | null
          owner_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          cnpj?: string | null
          owner_name?: string
          owner_cpf?: string | null
          email?: string
          phone: string
          address?: string | null
          city: string
          state: string
          plan?: 'starter' | 'basic' | 'pro' | 'enterprise'
          professionals_count?: string
          status?: 'active' | 'inactive' | 'suspended'
          address_zip?: string | null
          address_street?: string | null
          address_number?: string | null
          address_neighborhood?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          cnpj?: string | null
          owner_name?: string
          owner_cpf?: string | null
          email?: string
          phone?: string
          address?: string | null
          city?: string
          state?: string
          plan?: 'starter' | 'basic' | 'pro' | 'enterprise'
          professionals_count?: string
          status?: 'active' | 'inactive' | 'suspended'
          address_zip?: string | null
          address_street?: string | null
          address_number?: string | null
          address_neighborhood?: string | null
          owner_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Usuários admin do painel
      admin_users: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          cpf: string | null
          phone: string | null
          role: 'superadmin' | 'owner' | 'admin' | 'manager' | 'support' | 'viewer'
          salon_id: string | null
          permissions: Json
          must_change_password: boolean
          password_changed_at: string | null
          provisioned_at: string | null
          provisioned_by_request_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          cpf?: string | null
          phone?: string | null
          role?: 'superadmin' | 'owner' | 'admin' | 'manager' | 'support' | 'viewer'
          salon_id?: string | null
          permissions?: Json
          must_change_password?: boolean
          password_changed_at?: string | null
          provisioned_at?: string | null
          provisioned_by_request_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          cpf?: string | null
          phone?: string | null
          role?: 'superadmin' | 'owner' | 'admin' | 'manager' | 'support' | 'viewer'
          salon_id?: string | null
          permissions?: Json
          must_change_password?: boolean
          password_changed_at?: string | null
          provisioned_at?: string | null
          provisioned_by_request_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      // Profissionais/Equipe
      professionals: {
        Row: {
          id: string
          salon_id: string
          name: string
          email: string | null
          phone: string | null
          cpf: string | null
          rg: string | null
          address: string | null
          birth_date: string | null
          photo_url: string | null
          role: string | null
          specialty: string[] | null
          bio: string | null
          commission_rate: number
          working_days: Json
          working_hours: Json
          status: 'active' | 'inactive' | 'vacation'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          rg?: string | null
          address?: string | null
          birth_date?: string | null
          photo_url?: string | null
          role?: string | null
          specialty?: string[] | null
          bio?: string | null
          commission_rate?: number
          working_days?: Json
          working_hours?: Json
          status?: 'active' | 'inactive' | 'vacation'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          rg?: string | null
          address?: string | null
          birth_date?: string | null
          photo_url?: string | null
          role?: string | null
          specialty?: string[] | null
          bio?: string | null
          commission_rate?: number
          working_days?: Json
          working_hours?: Json
          status?: 'active' | 'inactive' | 'vacation'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      // Serviços
      services: {
        Row: {
          id: string
          salon_id: string
          name: string
          description: string | null
          category: string | null
          photo_url: string | null
          price: number
          duration: number
          commission_rate: number | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          description?: string | null
          category?: string | null
          photo_url?: string | null
          price: number
          duration: number
          commission_rate?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          description?: string | null
          category?: string | null
          photo_url?: string | null
          price?: number
          duration?: number
          commission_rate?: number | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      // Configurações Globais do Sistema
      system_settings: {
        Row: {
          id: string
          maintenance_mode: boolean
          require_manual_approval: boolean
          enable_system_emails: boolean
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          maintenance_mode?: boolean
          require_manual_approval?: boolean
          enable_system_emails?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          maintenance_mode?: boolean
          require_manual_approval?: boolean
          enable_system_emails?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      // Clientes/CRM
      clients: {
        Row: {
          id: string
          salon_id: string
          name: string
          email: string | null
          phone: string | null
          cpf: string | null
          birth_date: string | null
          gender: string | null
          photo_url: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          notes: string | null
          tags: string[] | null
          total_visits: number
          total_spent: number
          last_visit_at: string | null
          loyalty_points: number
          is_vip: boolean
          status: 'active' | 'inactive' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          birth_date?: string | null
          gender?: string | null
          photo_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          notes?: string | null
          tags?: string[] | null
          total_visits?: number
          total_spent?: number
          last_visit_at?: string | null
          loyalty_points?: number
          is_vip?: boolean
          status?: 'active' | 'inactive' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          cpf?: string | null
          birth_date?: string | null
          gender?: string | null
          photo_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          notes?: string | null
          tags?: string[] | null
          total_visits?: number
          total_spent?: number
          last_visit_at?: string | null
          loyalty_points?: number
          is_vip?: boolean
          status?: 'active' | 'inactive' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      // Agendamentos
      appointments: {
        Row: {
          id: string
          salon_id: string
          client_id: string | null
          professional_id: string | null
          service_id: string | null
          scheduled_date: string
          scheduled_time: string
          end_time: string | null
          duration: number
          status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          client_name: string | null
          client_phone: string | null
          service_name: string | null
          service_price: number | null
          additional_products: Json | null
          additional_price: number
          discount: number
          discount_reason: string | null
          total_price: number | null
          payment_status: 'pending' | 'paid' | 'partial' | 'refunded'
          payment_method: string | null
          paid_amount: number
          notes: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          rating: number | null
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          client_id?: string | null
          professional_id?: string | null
          service_id?: string | null
          scheduled_date: string
          scheduled_time: string
          end_time?: string | null
          duration: number
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          client_name?: string | null
          client_phone?: string | null
          service_name?: string | null
          service_price?: number | null
          additional_products?: Json | null
          additional_price?: number
          discount?: number
          discount_reason?: string | null
          total_price?: number | null
          payment_status?: 'pending' | 'paid' | 'partial' | 'refunded'
          payment_method?: string | null
          paid_amount?: number
          notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          rating?: number | null
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          client_id?: string | null
          professional_id?: string | null
          service_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          end_time?: string | null
          duration?: number
          status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          client_name?: string | null
          client_phone?: string | null
          service_name?: string | null
          service_price?: number | null
          additional_products?: Json | null
          additional_price?: number
          discount?: number
          discount_reason?: string | null
          total_price?: number | null
          payment_status?: 'pending' | 'paid' | 'partial' | 'refunded'
          payment_method?: string | null
          paid_amount?: number
          notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          rating?: number | null
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      // Transações Financeiras
      transactions: {
        Row: {
          id: string
          salon_id: string
          appointment_id: string | null
          type: 'income' | 'expense'
          category: string | null
          description: string | null
          amount: number
          payment_method: string | null
          professional_id: string | null
          commission_amount: number | null
          date: string
          status: 'pending' | 'completed' | 'cancelled'
          attachment_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          appointment_id?: string | null
          type: 'income' | 'expense'
          category?: string | null
          description?: string | null
          amount: number
          payment_method?: string | null
          professional_id?: string | null
          commission_amount?: number | null
          date: string
          status?: 'pending' | 'completed' | 'cancelled'
          attachment_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          appointment_id?: string | null
          type?: 'income' | 'expense'
          category?: string | null
          description?: string | null
          amount?: number
          payment_method?: string | null
          professional_id?: string | null
          commission_amount?: number | null
          date?: string
          status?: 'pending' | 'completed' | 'cancelled'
          attachment_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          }
        ]
      }
      // Produtos/Estoque
      products: {
        Row: {
          id: string
          salon_id: string
          name: string
          description: string | null
          category: string | null
          brand: string | null
          photo_url: string | null
          quantity: number
          unit: string
          min_quantity: number
          cost_price: number | null
          sale_price: number | null
          supplier: string | null
          supplier_contact: string | null
          barcode: string | null
          sku: string | null
          status: 'active' | 'inactive' | 'discontinued'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          description?: string | null
          category?: string | null
          brand?: string | null
          photo_url?: string | null
          quantity?: number
          unit?: string
          min_quantity?: number
          cost_price?: number | null
          sale_price?: number | null
          supplier?: string | null
          supplier_contact?: string | null
          barcode?: string | null
          sku?: string | null
          status?: 'active' | 'inactive' | 'discontinued'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          description?: string | null
          category?: string | null
          brand?: string | null
          photo_url?: string | null
          quantity?: number
          unit?: string
          min_quantity?: number
          cost_price?: number | null
          sale_price?: number | null
          supplier?: string | null
          supplier_contact?: string | null
          barcode?: string | null
          sku?: string | null
          status?: 'active' | 'inactive' | 'discontinued'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      // Configurações do Salão
      salon_settings: {
        Row: {
          id: string
          salon_id: string
          working_hours: Json
          booking_interval: number
          advance_booking_days: number
          cancellation_hours: number
          allow_online_booking: boolean
          require_confirmation: boolean
          sms_enabled: boolean
          email_enabled: boolean
          whatsapp_enabled: boolean
          reminder_hours: number
          loyalty_enabled: boolean
          points_per_real: number
          points_to_money: number
          tax_rate: number
          currency: string
          theme_color: string
          logo_url: string | null
          cover_url: string | null
          sidebar_compact: boolean
          animations_enabled: boolean
          notifications_enabled: boolean
          notification_email: string | null
          notification_whatsapp: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          working_hours?: Json
          booking_interval?: number
          advance_booking_days?: number
          cancellation_hours?: number
          allow_online_booking?: boolean
          require_confirmation?: boolean
          sms_enabled?: boolean
          email_enabled?: boolean
          whatsapp_enabled?: boolean
          reminder_hours?: number
          loyalty_enabled?: boolean
          points_per_real?: number
          points_to_money?: number
          tax_rate?: number
          currency?: string
          theme_color?: string
          logo_url?: string | null
          cover_url?: string | null
          sidebar_compact?: boolean
          animations_enabled?: boolean
          notifications_enabled?: boolean
          notification_email?: string | null
          notification_whatsapp?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          working_hours?: Json
          booking_interval?: number
          advance_booking_days?: number
          cancellation_hours?: number
          allow_online_booking?: boolean
          require_confirmation?: boolean
          sms_enabled?: boolean
          email_enabled?: boolean
          whatsapp_enabled?: boolean
          reminder_hours?: number
          loyalty_enabled?: boolean
          points_per_real?: number
          points_to_money?: number
          tax_rate?: number
          currency?: string
          theme_color?: string
          logo_url?: string | null
          cover_url?: string | null
          sidebar_compact?: boolean
          animations_enabled?: boolean
          notifications_enabled?: boolean
          notification_email?: string | null
          notification_whatsapp?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_settings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      // Integrações do Salão (WhatsApp, Pagamentos, Email, etc.)
      salon_integrations: {
        Row: {
          id: string
          salon_id: string
          whatsapp_enabled: boolean
          whatsapp_provider: string
          calendar_enabled: boolean
          payments_enabled: boolean
          payments_primary_gateway: string
          email_enabled: boolean
          email_provider: string
          api_webhooks_enabled: boolean
          whatsapp_settings: Json
          calendar_settings: Json
          payments_settings: Json
          email_settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          whatsapp_enabled?: boolean
          whatsapp_provider?: string
          calendar_enabled?: boolean
          payments_enabled?: boolean
          payments_primary_gateway?: string
          email_enabled?: boolean
          email_provider?: string
          api_webhooks_enabled?: boolean
          whatsapp_settings?: Json
          calendar_settings?: Json
          payments_settings?: Json
          email_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          whatsapp_enabled?: boolean
          whatsapp_provider?: string
          calendar_enabled?: boolean
          payments_enabled?: boolean
          payments_primary_gateway?: string
          email_enabled?: boolean
          email_provider?: string
          api_webhooks_enabled?: boolean
          whatsapp_settings?: Json
          calendar_settings?: Json
          payments_settings?: Json
          email_settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_integrations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          }
        ]
      }
      email_outbox: {
        Row: {
          id: string
          to_email: string
          subject: string
          html_body: string
          status: 'pending' | 'sent' | 'failed'
          attempts: number
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          to_email: string
          subject: string
          html_body: string
          status?: 'pending' | 'sent' | 'failed'
          attempts?: number
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          to_email?: string
          subject?: string
          html_body?: string
          status?: 'pending' | 'sent' | 'failed'
          attempts?: number
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Payment Webhooks - Idempotency table for webhook processing
      payment_webhooks: {
        Row: {
          id: string
          provider: 'mercadopago' | 'asaas'
          external_id: string
          event_type: string
          payload: Json
          raw_payload: Json | null
          status: 'pending' | 'processing' | 'processed' | 'failed'
          access_request_id: string | null
          processing_error: string | null
          processed_at: string | null
          ip_address: string | null
          user_agent: string | null
          signature_valid: boolean | null
          processing_attempts: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: 'mercadopago' | 'asaas'
          external_id: string
          event_type: string
          payload?: Json
          raw_payload?: Json | null
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          access_request_id?: string | null
          processing_error?: string | null
          processed_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          signature_valid?: boolean | null
          processing_attempts?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: 'mercadopago' | 'asaas'
          external_id?: string
          event_type?: string
          payload?: Json
          raw_payload?: Json | null
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          access_request_id?: string | null
          processing_error?: string | null
          processed_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          signature_valid?: boolean | null
          processing_attempts?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          }
        ]
      }
      // Provisioning Logs - Audit trail for tenant provisioning
      provisioning_logs: {
        Row: {
          id: string
          access_request_id: string
          stage: string
          status: 'started' | 'completed' | 'failed'
          details: Json | null
          error_message: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          access_request_id: string
          stage: string
          status: 'started' | 'completed' | 'failed'
          details?: Json | null
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          access_request_id?: string
          stage?: string
          status?: 'started' | 'completed' | 'failed'
          details?: Json | null
          error_message?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_logs_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_superadmin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_user_salon_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      provision_tenant: {
        Args: {
          p_request_id: string
          p_auth_user_id: string
          p_actor_id: string
        }
        Returns: void
      }
      mark_password_changed: {
        Args: {
          p_user_id: string
        }
        Returns: void
      }
      complete_onboarding_payment: {
        Args: {
          p_access_request_id: string
          p_payment_id: string
          p_payment_reference: string
        }
        Returns: void
      }
      provision_salon_from_payment: {
        Args: {
          p_access_request_id: string
          p_temporary_password: string
        }
        Returns: Json
      }
    }
    Enums: {
      request_status: 'pending' | 'approved' | 'rejected' | 'awaiting_payment'
      salon_status: 'active' | 'inactive' | 'suspended'
      salon_plan: 'basic' | 'pro' | 'enterprise'
      user_role: 'superadmin' | 'admin' | 'manager' | 'support' | 'viewer'
      email_status: 'pending' | 'sent' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type EmailOutbox = Database['public']['Tables']['email_outbox']['Row']
export type EmailOutboxInsert = Database['public']['Tables']['email_outbox']['Insert']

// Types helpers
export type AccessRequest = Database['public']['Tables']['access_requests']['Row']
export type AccessRequestInsert = Database['public']['Tables']['access_requests']['Insert']
export type Salon = Database['public']['Tables']['salons']['Row']
export type SalonInsert = Database['public']['Tables']['salons']['Insert']
export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type AdminUserInsert = Database['public']['Tables']['admin_users']['Insert']
export type Professional = Database['public']['Tables']['professionals']['Row']
export type ProfessionalInsert = Database['public']['Tables']['professionals']['Insert']
export type Service = Database['public']['Tables']['services']['Row']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type SalonSettings = Database['public']['Tables']['salon_settings']['Row']
export type SalonSettingsInsert = Database['public']['Tables']['salon_settings']['Insert']
export type SalonIntegration = Database['public']['Tables']['salon_integrations']['Row']
export type SalonIntegrationInsert = Database['public']['Tables']['salon_integrations']['Insert']
