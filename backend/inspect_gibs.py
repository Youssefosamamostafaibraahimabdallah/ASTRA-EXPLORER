import xml.etree.ElementTree as ET

file = "gibs-capabilities.xml"
root = ET.parse(file).getroot()

target = "VIIRS_SNPP_CorrectedReflectance_TrueColor"

for layer in root.iter():
    if layer.tag.endswith("Layer"):
        identifier = next(
            (x.text for x in layer
             if x.tag.endswith("Identifier")),
            None
        )

        if identifier == target:
            print("\nFOUND LAYER:", identifier)

            for child in layer:
                if child.tag.endswith("Format"):
                    print("FORMAT:", child.text)

                elif child.tag.endswith("Dimension"):
                    print("DIMENSION:")
                    for item in child:
                        print(" ", item.tag.split("}")[-1], item.text)

                elif child.tag.endswith("TileMatrixSetLink"):
                    for item in child:
                        print("TILE MATRIX:", item.text)

                elif child.tag.endswith("ResourceURL"):
                    print("URL:", child.attrib.get("template"))

            break
else:
    print("Layer not found:", target)
