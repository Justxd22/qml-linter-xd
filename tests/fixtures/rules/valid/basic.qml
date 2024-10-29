import QtQuick 2.15

Rectangle {
    id: root
    width: 100
    height: 100
    color: "red"

    property int counter: 0

    signal clicked

    function increment() {
        counter += 1;
    }

    MouseArea {
        anchors.fill: parent
        onClicked: {
            root.increment();
            root.clicked();
        }
    }
}