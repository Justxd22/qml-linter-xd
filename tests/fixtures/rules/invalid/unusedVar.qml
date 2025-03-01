import QtQuick 2.15

Rectangle {
    id: root
    width: 100
    height: 100
    
    property int unusedProperty: 0  // This should trigger a warning
    property string usedProperty: "test"
    
    Text {
        text: root.usedProperty
    }

    Component.onCompleted: {
        let x = 10;
        let y = 0;
        if (x === 10) {  // Should trigger warning
            processData();
        }
    }
}