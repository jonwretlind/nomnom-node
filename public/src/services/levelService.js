const API_URL = 'http://localhost:3002/api/levels';

export async function getLevels() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch levels');
        }
        const data = await response.json();
        console.log('Fetched levels:', data);  // Debug log
        return data;
    } catch (error) {
        console.error('Error fetching levels:', error);
        throw error;
    }
}

export async function getLevel(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch level');
        }
        const data = await response.json();
        console.log('Fetched level:', data);  // Debug log
        return data;
    } catch (error) {
        console.error('Error fetching level:', error);
        throw error;
    }
}

export async function getLevelByNumber(levelNumber) {
    try {
        const response = await fetch(`${API_URL}/number/${levelNumber}`);
        if (!response.ok) {
            throw new Error('Failed to fetch level');
        }
        const data = await response.json();
        console.log('Fetched level by number:', data);  // Debug log
        return data;
    } catch (error) {
        console.error('Error fetching level:', error);
        throw error;
    }
} 