
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { MegaphoneIcon, ShieldCheckIcon, FireExtinguisherIcon } from '../../components/icons/Icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; buttonText: string; linkTo: string; }> = ({ icon, title, description, buttonText, linkTo }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-6 flex flex-col items-center text-center">
            <div className="text-brand-primary mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-dark-text mb-2">{title}</h3>
            <p className="text-dark-text-secondary flex-grow mb-4">{description}</p>
            <Button variant="secondary" onClick={() => navigate(linkTo)}>{buttonText}</Button>
        </div>
    );
}

const PublicHome: React.FC = () => {
    return (
        <div className="space-y-12">
            <div className="text-center py-16 bg-dark-card rounded-lg border border-dark-border">
                <FireExtinguisherIcon className="mx-auto h-20 w-20 text-brand-primary" />
                <h1 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl">
                    Welcome to the Anytown Fire Department Portal
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-dark-text-secondary">
                    Your community resource for safety information, services, and announcements.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<MegaphoneIcon className="h-12 w-12" />}
                    title="Latest Announcements"
                    description="Stay up-to-date with the latest news, burn bans, and community events from the fire department."
                    buttonText="View Announcements"
                    linkTo="/announcements"
                />
                <FeatureCard 
                    icon={<ShieldCheckIcon className="h-12 w-12" />}
                    title="Storm Shelter Registry"
                    description="Register your storm shelter with us to help first responders locate you quickly during an emergency."
                    buttonText="Register a Shelter"
                    linkTo="/storm-shelter-registry"
                />
                <FeatureCard 
                    icon={<FireExtinguisherIcon className="h-12 w-12" />}
                    title="Burn Permits"
                    description="Planning a controlled burn? Apply for a burn permit online to ensure you're following local safety guidelines."
                    buttonText="Apply for a Permit"
                    linkTo="/burn-permit-application"
                />
            </div>
        </div>
    );
};

export default PublicHome;
