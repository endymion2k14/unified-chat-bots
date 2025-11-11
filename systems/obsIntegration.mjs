export default {
    name: 'obsIntegration',
    init(client) {
        // Currently inactive - no event listeners attached
        // Placeholder for future OBS integrations

        // Example: Change scene on new follower
        // Uncomment and customize as needed
        // client.on('follow', async (event) => {
        //     if (client.obsClients && client.obsClients.length > 0) {
        //         const obsClient = client.obsClients[0]; // Use first OBS bot
        //         await obsClient.changeScene('FollowerScene');
        //         // Optionally update a text source with follower name
        //         await obsClient.setTextSource('FollowerScene', 'FollowerName', event.user_name);
        //     }
        // });

        // Example: Enable alert source on raid for 30 seconds
        // client.on('raid', async (event) => {
        //     if (client.obsClients && client.obsClients.length > 0) {
        //         const obsClient = client.obsClients[0];
        //         await obsClient.setSourceEnabled('Main', 'RaidAlert', true, 30);
        //     }
        // });

        // Example: Play ban sound via OBS media source
        // Uncomment to enable - requires OBS media source named 'BanSound' in the current scene
        // client.on('ban', async (event) => {
        //     if (client.obsClients && client.obsClients.length > 0) {
        //         const obsClient = client.obsClients[0];
        //         const currentScene = await obsClient.getCurrentScene();
        //         if (currentScene) {
        //             // Enable sound source for 5 seconds in current scene
        //             await obsClient.setSourceEnabled(currentScene, 'BanSound', true, 5);
        //         }
        //     }
        // });

        // Add more event integrations here
    }
}