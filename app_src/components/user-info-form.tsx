"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { User, Mail, Building, AlertCircle } from "lucide-react"

interface UserInfo {
    name: string
    email: string
    affiliation: string
}

interface UserInfoFormProps {
    onSubmit: (userInfo: UserInfo) => void
    isSubmitting: boolean
}

export function UserInfoForm({ onSubmit, isSubmitting }: UserInfoFormProps) {
    const [userInfo, setUserInfo] = useState<UserInfo>({
        name: "",
        email: "",
        affiliation: "",
    })
    const [errors, setErrors] = useState<Partial<UserInfo>>({})

    const validateForm = (): boolean => {
        const newErrors: Partial<UserInfo> = {}

        if (!userInfo.name.trim()) {
            newErrors.name = "Name is required"
        }

        if (!userInfo.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
            newErrors.email = "Please enter a valid email address"
        }

        if (!userInfo.affiliation.trim()) {
            newErrors.affiliation = "Affiliation is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onSubmit(userInfo)
        }
    }

    const handleInputChange = (field: keyof UserInfo, value: string) => {
        setUserInfo((prev) => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }))
        }
    }

    return (
        <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertCircle className="w-5 h-5" />
                    User Information Required
                </CardTitle>
                <p className="text-sm text-orange-700">
                    Please provide your information to receive the evaluation report via email.
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Full Name *
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={userInfo.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address *
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            value={userInfo.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="affiliation" className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Affiliation *
                        </Label>
                        <Input
                            id="affiliation"
                            type="text"
                            placeholder="Enter your organization/institution"
                            value={userInfo.affiliation}
                            onChange={(e) => handleInputChange("affiliation", e.target.value)}
                            className={errors.affiliation ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {errors.affiliation && <p className="text-sm text-red-600">{errors.affiliation}</p>}
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Processing Evaluation..." : "Submit & Start Evaluation"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
