"""
Remove mesh objects left behind by older versions of export-layers-glb.py.

Those versions ran _-Mesh on every non-mesh object before exporting, but on
this Rhino version the new meshes are not left selected, so the script never
found them to delete. Each export run added another mesh copy of every brep on
its layer, and later exports included all the copies (files ~6x larger).

A leftover is a mesh whose bounding box matches a non-mesh object on the same
layer — i.e. it is a meshing of that object sitting exactly on top of it.
Layers that contain only meshes (HULL, DECK, ...) are never touched.

Run once with DRY_RUN = True and check the report: on an affected layer the
candidate count should be a whole multiple of the non-mesh count (one copy per
old export run). Then set DRY_RUN = False and run again.
"""
import rhinoscriptsyntax as rs

DRY_RUN = False
MESH_OBJECT_TYPE = 32
# Bounding boxes are compared per coordinate with this tolerance, as a
# fraction of the object's bounding-box diagonal. Meshes hug the surface, so
# their box can be a hair smaller than the brep's.
BBOX_TOLERANCE = 0.01


def bbox_corners(obj):
    bbox = rs.BoundingBox(obj)
    if not bbox:
        return None
    lo, hi = bbox[0], bbox[6]
    diag = ((hi[0] - lo[0]) ** 2 + (hi[1] - lo[1]) ** 2 + (hi[2] - lo[2]) ** 2) ** 0.5
    return (lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]), diag


def boxes_match(a, b, tol):
    return all(abs(x - y) <= tol for x, y in zip(a, b))


def find_leftovers_on_layer(layer):
    objs = rs.ObjectsByLayer(layer) or []
    meshes = [o for o in objs if rs.ObjectType(o) == MESH_OBJECT_TYPE]
    sources = [o for o in objs if rs.ObjectType(o) != MESH_OBJECT_TYPE]
    if not meshes or not sources:
        return [], len(sources), len(meshes)

    source_boxes = []
    for src in sources:
        info = bbox_corners(src)
        if info:
            source_boxes.append(info)

    leftovers = []
    for mesh in meshes:
        info = bbox_corners(mesh)
        if not info:
            continue
        box, diag = info
        tol = max(diag, 1e-6) * BBOX_TOLERANCE
        if any(boxes_match(box, sbox, tol) for sbox, _ in source_boxes):
            leftovers.append(mesh)

    return leftovers, len(sources), len(meshes)


def cleanup_leftover_meshes():
    layers = rs.LayerNames() or []
    total_candidates = 0
    total_deleted = 0
    affected_layers = 0

    print(f"{'DRY RUN — ' if DRY_RUN else ''}Scanning {len(layers)} layers for leftover meshes...")

    for layer in layers:
        leftovers, n_sources, n_meshes = find_leftovers_on_layer(layer)
        if not leftovers:
            continue

        affected_layers += 1
        total_candidates += len(leftovers)
        ratio = len(leftovers) / float(n_sources) if n_sources else 0
        print(f"{layer}")
        print(f"    {n_sources} non-mesh, {n_meshes} mesh, {len(leftovers)} leftover candidates ({ratio:.1f} per source)")

        if DRY_RUN:
            continue

        locked = [o for o in leftovers if rs.IsObjectLocked(o)]
        if locked:
            print(f"    skipping {len(locked)} locked objects")
        deletable = [o for o in leftovers if o not in locked]
        if deletable and rs.DeleteObjects(deletable):
            total_deleted += len(deletable)
            print(f"    deleted {len(deletable)}")
        elif deletable:
            print("    delete failed")

    print("")
    print(f"{affected_layers} layers affected, {total_candidates} leftover meshes found")
    if DRY_RUN:
        print("Nothing deleted. Set DRY_RUN = False to remove them.")
    else:
        print(f"Deleted {total_deleted} objects. Save the document to keep this.")
        rs.Redraw()


if __name__ == '__main__':
    cleanup_leftover_meshes()
