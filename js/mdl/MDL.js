
function loadNav() {
    var layout = $('#main-layout');
    var drawerTemplate = $('#header-drawer').html();
    var drawerOutput = Mustache.render(drawerTemplate, {
        menu: {
            title: "Projects",
            id: "projects",
            class: "mdl-layout-title",
            icon: "",
            link: "",
            text: "",
            items: [
                {
                    title: "B2World",
                    id: "B2World",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "B2World.html",
                    text: "B2World"
                },
                {
                    title: "CameraWorld",
                    id: "CameraWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "CameraWorld.html",
                    text: "CameraWorld"
                },
                {
                    title: "Evolve",
                    id: "Evolve",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "Evolve.html",
                    text: "Evolve"
                },
                {
                    title: "GridWorld",
                    id: "GridWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "GridWorld.html",
                    text: "GridWorld"
                },
                {
                    title: "GUI",
                    id: "GUI",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "GUI.html",
                    text: "GUI"
                },
                {
                    title: "HexMazeWorld",
                    id: "HexMazeWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "HexMazeWorld.html",
                    text: "HexMazeWorld"
                },
                {
                    title: "HexWorld",
                    id: "HexWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "HexWorld.html",
                    text: "HexWorld"
                },
                {
                    title: "Life",
                    id: "Life",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "Life.html",
                    text: "Life"
                },
                {
                    title: "MatterWorld",
                    id: "MatterWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "MatterWorld.html",
                    text: "MatterWorld"
                },
                {
                    title: "MazeWorld",
                    id: "MazeWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "MazeWorld.html",
                    text: "MazeWorld"
                },
                {
                    title: "P2World",
                    id: "P2World",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "P2World.html",
                    text: "P2World"
                },
                {
                    title: "Platformer",
                    id: "Platformer",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "Platformer.html",
                    text: "Platformer"
                },
                {
                    title: "PuckWorld",
                    id: "PuckWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "PuckWorld.html",
                    text: "PuckWorld"
                },
                {
                    title: "TileMap",
                    id: "TileMap",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "TileMap.html",
                    text: "TileMap"
                },
                {
                    title: "TreasureWorld",
                    id: "TreasureWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "TreasureWorld.html",
                    text: "TreasureWorld"
                },
                {
                    title: "WaterWorld",
                    id: "WaterWorld",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "WaterWorld.html",
                    text: "WaterWorld"
                },
                {
                    title: "WaterWorldEX",
                    id: "WaterWorldEX",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "WaterWorldEX.html",
                    text: "WaterWorldEX"
                },
                {
                    title: "WaterWorldGA",
                    id: "WaterWorldGA",
                    class: "mdl-navigation__link",
                    icon: "public",
                    link: "WaterWorldGA.html",
                    text: "WaterWorldGA"
                }
            ]
        }
    });
    layout.prepend(drawerOutput);

    var headerTemplate = $('#header-navigation').html();
    var headerOutput = Mustache.render(headerTemplate, {
        menu: {
            title: "Learninator",
            id: "Learninator",
            class: "mdl-layout-title",
            icon: "",
            link: "",
            text: "",
            items: [
                {
                    title: "Home",
                    id: "home",
                    class: "mdl-navigation__link",
                    icon: "home",
                    link: "index.html",
                    text: "Home"
                },
                {
                    title: "About",
                    id: "about",
                    class: "mdl-navigation__link",
                    icon: "info",
                    link: "#",
                    text: "About"
                },
                {
                    title: "Contact",
                    id: "contact",
                    class: "mdl-navigation__link",
                    icon: "mail",
                    link: "#",
                    text: "Contact"
                }
            ]
        }
    });
    layout.prepend(headerOutput);

}