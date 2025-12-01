"use client"

import Image from "next/image"

export function Header() {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between">
                    {/* Logo on the left */}
                    <div className="relative flex-shrink-0 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        <Image
                            src="/logo.svg"
                            alt="MBZUAI EduNLP Logo"
                            width={85}
                            height={85}
                            className="relative rounded-full shadow-lg ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-300 hover:scale-105"
                            priority
                        />
                    </div>

                    {/* Title and tagline centered */}
                    <div className="flex-1 text-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                            AI Tutor Evaluation Platform
                        </h1>
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-base text-blue-600 font-semibold">Powered by MBZUAI EduNLP</p>
                        </div>
                    </div>

                    {/* Empty space on the right for balance */}
                    <div className="w-[85px] flex-shrink-0"></div>
                </div>
            </div>
        </header>
    )
}
