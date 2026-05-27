import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const useProperties = () => {
    const [properties, setProperties] = useState([]);
    const [allProperties, setAllProperties] = useState([]);
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [filteredProperties, setFilteredProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, "properties"));
                const fetched = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const visible = fetched.filter(p => !p.status || p.status === 'available' || p.status === 'reserved' || p.status === 'sold');

                // Sort by creation time desc if available
                visible.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                const featured = visible.filter(p => p.featured);
                const regular = visible.filter(p => !p.featured);

                setAllProperties(visible);
                setProperties(regular);
                setFilteredProperties(visible);
                setFeaturedProperties(featured);

            } catch (err) {
                console.error("Error fetching properties:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, []);

    return {
        properties,
        allProperties,
        featuredProperties,
        filteredProperties,
        setFilteredProperties,
        loading,
        error
    };
};
