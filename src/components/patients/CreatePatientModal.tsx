'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, TextArea, Button } from '@/components/ui'
import { useApp } from '@/contexts/AppContext'
import { useLanguage } from '@/i18n'
import { Patient, FunnelStatus, LeadSource } from '@/types'

interface CreatePatientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (patient: Patient) => void
  defaultStatus?: FunnelStatus
  defaultSource?: LeadSource
}

interface FormData {
  name: string
  phone: string
  email: string
  identificationNumber: string
  source: LeadSource
  treatments: string
  notes: string
}

interface FormErrors {
  name?: string
  phone?: string
  email?: string
}

export default function CreatePatientModal({
  isOpen,
  onClose,
  onSuccess,
  defaultStatus = 'new',
  defaultSource = 'instagram',
}: CreatePatientModalProps) {
  const { addPatient, state } = useApp()
  const { t } = useLanguage()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    identificationNumber: '',
    source: defaultSource,
    treatments: '',
    notes: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        identificationNumber: '',
        source: defaultSource,
        treatments: '',
        notes: '',
      })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, defaultSource])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t.common.required || 'Required'
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = t.common.required || 'Required'
    } else if (formData.phone.length < 8) {
      newErrors.phone = 'Phone must be at least 8 characters'
    }

    // Email validation (only if provided)
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare patient data
      const patientData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        identificationNumber: formData.identificationNumber.trim() || undefined,
        source: formData.source,
        status: defaultStatus,
        treatments: formData.treatments.trim() 
          ? formData.treatments.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        assignedTo: state.user.id,
      }

      // Add patient using AppContext
      await addPatient(patientData)

      // Create a mock patient object for the callback
      // Note: In a real scenario, addPatient would return the created patient
      const newPatient: Patient = {
        ...patientData,
        id: `patient-${Date.now()}`, // Temporary ID
        notes: [],
        followUps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Patient

      console.log('Patient created successfully:', newPatient)

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newPatient)
      }

      // Close modal
      onClose()
    } catch (error) {
      console.error('Error creating patient:', error)
      // In a real app, you might want to show a toast notification here
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.patients?.newPatient || 'New Patient'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t.patientForm?.name || 'Name'}
          placeholder={t.patientForm?.namePlaceholder || 'Patient name'}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          required
          disabled={isSubmitting}
        />

        <Input
          label={t.patientForm?.phone || 'Phone'}
          placeholder={t.patientForm?.phonePlaceholder || '+1 555 123 4567'}
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          error={errors.phone}
          required
          disabled={isSubmitting}
        />

        <Input
          label={`${t.patientForm?.email || 'Email'} (${t.common?.optional || 'optional'})`}
          placeholder={t.patientForm?.emailPlaceholder || 'patient@email.com'}
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          disabled={isSubmitting}
        />

        <Input
          label={`${t.patientForm?.identificationNumber || 'ID Number'} (${t.common?.optional || 'optional'})`}
          placeholder={t.patientForm?.identificationPlaceholder || 'ID Number'}
          value={formData.identificationNumber}
          onChange={(e) => handleInputChange('identificationNumber', e.target.value)}
          disabled={isSubmitting}
        />

        <Select
          label={t.patientForm?.source || 'Source'}
          value={formData.source}
          onChange={(value) => handleInputChange('source', value)}
          options={[
            { value: 'instagram', label: t.sources?.instagram || 'Instagram' },
            { value: 'whatsapp', label: t.sources?.whatsapp || 'WhatsApp' },
            { value: 'phone', label: t.sources?.phone || 'Phone' },
            { value: 'website', label: t.sources?.website || 'Website' },
            { value: 'referral', label: t.sources?.referral || 'Referral' },
            { value: 'other', label: t.sources?.other || 'Other' },
          ]}
          disabled={isSubmitting}
        />

        <Input
          label={`${t.patients?.treatmentsOfInterest || 'Treatments of interest'} (${t.common?.optional || 'optional'})`}
          placeholder="Botox, Fillers, etc."
          value={formData.treatments}
          onChange={(e) => handleInputChange('treatments', e.target.value)}
          disabled={isSubmitting}
        />

        <TextArea
          label={`${t.patients?.notes || 'Notes'} (${t.common?.optional || 'optional'})`}
          placeholder={t.patients?.notesPlaceholder || 'Additional notes'}
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t.common?.cancel || 'Cancel'}
          </Button>
          <Button
            type="submit"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (t.common?.saving || 'Saving...') 
              : (t.patients?.addPatient || 'Add Patient')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
