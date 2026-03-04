import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { BookOpen, Users, Calendar, ListOrdered, Pill, FlaskConical, CreditCard, FileText, ChevronDown, ChevronRight, Info, Settings } from "lucide-react";

export default function Documentation() {
    const [expandedSections, setExpandedSections] = useState({});

    const toggleSection = (sectionId) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionId]: !prev[sectionId]
        }));
    };

    const documentationSections = [
        {
            id: 1,
            title: "Patient Management",
            description: "Comprehensive guide to managing patient records and information",
            icon: <Users className="w-6 h-6" />,
            color: "bg-blue-100 text-blue-700",
            content: [
                {
                    subtitle: "Adding New Patients",
                    steps: [
                        "Navigate to 'Patients' from the sidebar",
                        "Click the 'Add Patient' button",
                        "Fill in patient details (name, contact, date of birth, etc.)",
                        "Submit the form to create the patient record"
                    ]
                },
                {
                    subtitle: "Viewing Patient Details",
                    steps: [
                        "Search for a patient using the search bar",
                        "Click on a patient card to view full details",
                        "Access patient history, treatments, and billing information",
                        "Update patient information as needed"
                    ]
                }
            ]
        },
        {
            id: 2,
            title: "Appointment System",
            description: "Schedule and manage patient appointments efficiently",
            icon: <Calendar className="w-6 h-6" />,
            color: "bg-purple-100 text-purple-700",
            content: [
                {
                    subtitle: "Creating Appointments",
                    steps: [
                        "Go to 'Appointments' section",
                        "Click 'New Appointment'",
                        "Select patient, doctor, date, and time",
                        "Add any relevant notes or reasons for visit",
                        "Confirm appointment booking"
                    ]
                },
                {
                    subtitle: "Managing Appointments",
                    steps: [
                        "Doctors can view their own appointment schedule",
                        "Admins can filter appointments by doctor",
                        "Update appointment status (Confirmed, Completed, Cancelled)",
                        "Use search to find specific patient appointments"
                    ]
                }
            ]
        },
        {
            id: 3,
            title: "Queue System",
            description: "Manage patient flow and waiting queues",
            icon: <ListOrdered className="w-6 h-6" />,
            color: "bg-green-100 text-green-700",
            content: [
                {
                    subtitle: "Adding Patients to Queue",
                    steps: [
                        "From patient details page, click 'Add to Queue'",
                        "Patient is added to waiting list",
                        "Real-time badge shows queue count in sidebar",
                        "Queue updates automatically for all users"
                    ]
                },
                {
                    subtitle: "Attending to Patients",
                    steps: [
                        "Navigate to 'Queue' from sidebar",
                        "View list of waiting patients",
                        "Click 'Attend to Patient' to start consultation",
                        "Patient is removed from queue and treatment begins"
                    ]
                }
            ]
        },
        {
            id: 4,
            title: "Pharmacy Module",
            description: "E-prescription queue and medication dispensation workflow",
            icon: <Pill className="w-6 h-6" />,
            color: "bg-orange-100 text-orange-700",
            content: [
                {
                    subtitle: "Prescription Process",
                    steps: [
                        "Doctor prescribes medication during treatment",
                        "Prescription is sent to pharmacy queue",
                        "Pharmacist views pending prescriptions",
                        "Medication is dispensed and inventory is updated"
                    ]
                },
                {
                    subtitle: "Dispensing Medications",
                    steps: [
                        "Access pharmacy dashboard",
                        "View pending prescription orders",
                        "Verify medication availability",
                        "Dispense drugs and confirm quantities",
                        "System automatically updates billing and inventory"
                    ]
                }
            ]
        },
        {
            id: 5,
            title: "Laboratory Module",
            description: "Lab test requests, sample processing, and results management",
            icon: <FlaskConical className="w-6 h-6" />,
            color: "bg-teal-100 text-teal-700",
            content: [
                {
                    subtitle: "Requesting Lab Tests",
                    steps: [
                        "Doctor orders lab tests during treatment",
                        "Select tests from available categories",
                        "Tests are sent to laboratory queue",
                        "Sample collection is initiated"
                    ]
                },
                {
                    subtitle: "Processing Lab Tests",
                    steps: [
                        "Lab technician views pending test requests",
                        "Collect and register samples",
                        "Perform tests and enter results",
                        "Submit results for doctor review",
                        "Costs are automatically added to patient bill"
                    ]
                }
            ]
        },
        {
            id: 6,
            title: "Billing System",
            description: "Event-driven billing with automatic aggregation",
            icon: <CreditCard className="w-6 h-6" />,
            color: "bg-pink-100 text-pink-700",
            content: [
                {
                    subtitle: "Automatic Bill Generation",
                    steps: [
                        "Bills are created automatically when treatment starts",
                        "Consultation fees are added immediately",
                        "Lab test costs are added when tests are ordered",
                        "Medication costs are added when prescriptions are dispensed",
                        "Bill updates in real-time across all modules"
                    ]
                },
                {
                    subtitle: "Viewing and Managing Bills",
                    steps: [
                        "Access billing through patient details or billing section",
                        "View itemized breakdown of charges",
                        "Process payments and update payment status",
                        "Generate receipts and billing reports"
                    ]
                }
            ]
        }
    ];

    const systemInfo = [
        {
            label: "Version",
            value: "2.0.0",
        },
        {
            label: "Last Updated",
            value: "December 2025",
        },
        {
            label: "Frontend",
            value: "React 18 + Vite",
        },
        {
            label: "Backend",
            value: "Laravel + MySQL",
        },
    ];

    return (
        <DashboardLayout>
            <div className="min-h-screen">
                <div className="w-full max-w-full">
                    {/* Header */}
                    <div className="mb-6 pt-24">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" />
                            System Documentation
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Complete guide to using the Naitiri Jambo HMS
                        </p>
                    </div>

                    {/* System Info Card */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <Settings className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Naitiri Jambo HMS</h2>
                                <p className="text-sm text-blue-100">Hospital Management System</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {systemInfo.map((info, idx) => (
                                <div key={idx} className="bg-white bg-opacity-10 rounded-lg p-3">
                                    <p className="text-xs text-blue-100 mb-1">{info.label}</p>
                                    <p className="text-sm font-semibold">{info.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Documentation Sections */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            Feature Documentation
                        </h2>

                        {documentationSections.map((section) => (
                            <div key={section.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                {/* Section Header */}
                                <div
                                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${section.color}`}>
                                            {section.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                                                </div>
                                                <div className="ml-4">
                                                    {expandedSections[section.id] ? (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable Content */}
                                {expandedSections[section.id] && (
                                    <div className="px-5 pb-5 border-t border-gray-100">
                                        <div className="space-y-6 mt-4">
                                            {section.content.map((subsection, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-800 mb-3">{subsection.subtitle}</h4>
                                                    <ol className="space-y-2">
                                                        {subsection.steps.map((step, stepIdx) => (
                                                            <li key={stepIdx} className="flex items-start gap-3 text-sm text-gray-700">
                                                                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold">
                                                                    {stepIdx + 1}
                                                                </span>
                                                                <span className="pt-0.5">{step}</span>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <Info className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-2">Need Additional Help?</p>
                                <p className="text-sm text-gray-700 mb-2">
                                    This documentation covers the core features of the Naitiri Jambo HMS. For detailed technical support, advanced configurations, or reporting issues, please contact your system administrator.
                                </p>
                                <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Tip:</span> Click on any section above to expand and view detailed step-by-step instructions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
