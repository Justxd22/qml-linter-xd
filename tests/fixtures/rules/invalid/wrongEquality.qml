import QtQuick 2.15

Rectangle {
    id: root
    width: 100
    height: 100
    
    property bool isVisible: true
    
    Rectangle {
        visible: root.isVisible == true  // This should trigger a warning
    }
}