import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    role: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.role === 'admin'
  },

  actions: {
    async login(email, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      await this.loadUser()
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.role = null
    },

    async loadUser() {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user ?? null
      this.user = user

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        console.log("PROFILE:", profile)
        console.log("ERROR:", error)

        this.role = profile?.role ?? null
      } else {
        this.role = null
      }

      console.log("FINAL ROLE:", this.role)
    }
  }
})
