import xml.etree.ElementTree as ET

root = ET.parse("gibs-capabilities.xml").getroot()

for layer in root.iter():
    if layer.tag.endswith("Layer"):
        identifier = next(
            (x.text for x in layer
             if x.tag.endswith("Identifier")),
            None
        )

        if identifier and (
            "BlueMarble" in identifier
            or "ShadedRelief" in identifier
        ):
            print("\nLAYER:", identifier)

            for child in layer:
                if child.tag.endswith("Format"):
                    print("FORMAT:", child.text)

                elif child.tag.endswith("TileMatrixSetLink"):
                    for item in child:
                        print("TILE MATRIX:", item.text)

                elif child.tag.endswith("ResourceURL"):
                    print("URL:", child.attrib.get("template"))
