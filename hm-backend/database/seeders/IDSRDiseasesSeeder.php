<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\IDSRDisease;

class IDSRDiseasesSeeder extends Seeder
{
    public function run()
    {
        $diseases = [
            // Immediately Notifiable Diseases
            [
                'disease_name' => 'Cholera',
                'disease_code' => 'A00',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Acute watery diarrhea with severe dehydration in areas with no known cholera outbreak'
            ],
            [
                'disease_name' => 'Measles',
                'disease_code' => 'B05',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Fever + generalized rash + one of: cough, coryza (runny nose), conjunctivitis (red eyes)'
            ],
            [
                'disease_name' => 'Yellow Fever',
                'disease_code' => 'A95',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Acute onset of fever with jaundice appearing within 14 days of onset of first symptoms'
            ],
            [
                'disease_name' => 'Viral Hemorrhagic Fevers (Ebola, Marburg)',
                'disease_code' => 'A98',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Illness with onset of fever and no response to treatment + at least one hemorrhagic symptom'
            ],
            [
                'disease_name' => 'Acute Flaccid Paralysis (AFP)',
                'disease_code' => 'G82',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Sudden onset of weakness in any part of the body in a child less than 15 years'
            ],
            [
                'disease_name' => 'Plague',
                'disease_code' => 'A20',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Fever + painful lymph node swelling OR severe pneumonia'
            ],
            [
                'disease_name' => 'Anthrax',
                'disease_code' => 'A22',
                'is_priority' => true,
                'is_immediately_notifiable' => true,
                'case_definition' => 'Skin lesion evolving over 1-6 days with black center OR severe respiratory illness after animal contact'
            ],
            
            // Priority Diseases (Weekly Reporting)
            [
                'disease_name' => 'Malaria',
                'disease_code' => 'B50-B54',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Fever with positive malaria test (microscopy or RDT)'
            ],
            [
                'disease_name' => 'Tuberculosis',
                'disease_code' => 'A15-A19',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Cough for more than 2 weeks with or without positive sputum smear/GeneXpert'
            ],
            [
                'disease_name' => 'Diarrhea with Dehydration (Under 5 years)',
                'disease_code' => 'A09',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Passage of 3 or more loose/liquid stools per day with signs of dehydration'
            ],
            [
                'disease_name' => 'Pneumonia',
                'disease_code' => 'J18',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Cough or difficult breathing with fast breathing or chest indrawing'
            ],
            [
                'disease_name' => 'Typhoid Fever',
                'disease_code' => 'A01',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Fever for 3+ days with positive Widal test or blood culture'
            ],
            [
                'disease_name' => 'Meningitis',
                'disease_code' => 'G03',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Sudden onset of fever + neck stiffness +/- altered consciousness, vomiting'
            ],
            [
                'disease_name' => 'Rabies (Animal Bite)',
                'disease_code' => 'A82',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Person bitten by suspected rabid animal OR neurological symptoms after animal bite'
            ],
            [
                'disease_name' => 'Dengue Fever',
                'disease_code' => 'A90',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Acute febrile illness with 2+ symptoms: headache, retro-orbital pain, myalgia, arthralgia, rash, hemorrhagic manifestations'
            ],
            [
                'disease_name' => 'Dysentery (Bloody Diarrhea)',
                'disease_code' => 'A03',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Diarrhea with visible blood in stool'
            ],
            
            // Other Notifiable Diseases
            [
                'disease_name' => 'Hepatitis B',
                'disease_code' => 'B16',
                'is_priority' => false,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Jaundice with positive HBsAg test'
            ],
            [
                'disease_name' => 'COVID-19',
                'disease_code' => 'U07.1',
                'is_priority' => true,
                'is_immediately_notifiable' => false,
                'case_definition' => 'Acute respiratory illness with positive PCR/RDT test for SARS-CoV-2'
            ],
        ];

        foreach ($diseases as $disease) {
            IDSRDisease::create($disease);
        }
    }
}
