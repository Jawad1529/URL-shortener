import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import StatCard from '../molecules/StatCard';

const AnalyticsOverview = ({ data, loading }) => {
    if (loading) {
        return <p className="text-center p-5">Loading analytics...</p>;
    }

    if (!data) {
        return <p className="text-center p-5 text-gray-500">No analytics data available.</p>;
    }

    return (
        <div className="p-4">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 mb-4">
                <StatCard title="Total Clicks" value={data.totalClicks} color="primary" />
                <StatCard title="Unique Visitors" value={data.uniqueVisitors} color="secondary" />
                <StatCard title="Today" value={data.clicksToday} color="success" />
            </div>

            {data.recentClicks.length > 0 && (
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Recent Clicks</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">Time</th>
                                    <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">Referrer</th>
                                    <th className="p-2 text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">Country</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentClicks.map((click, index) => (
                                    <tr key={index}>
                                        <td className="p-2 text-sm border-b border-gray-100">{new Date(click.timestamp).toLocaleString()}</td>
                                        <td className="p-2 text-sm border-b border-gray-100">{click.referrer || 'Direct'}</td>
                                        <td className="p-2 text-sm border-b border-gray-100">{click.country || 'Unknown'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </IonCardContent>
                </IonCard>
            )}
        </div>
    );
};

export default AnalyticsOverview;
